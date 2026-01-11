import { action, query } from "@solidjs/router";

import type { Answer } from "~/lib/domain";

import {
  generateQuestions,
  generateResult,
  generateTitleAndDescription,
} from "./ai";
import { db } from "./db";
import { jobsDb } from "./jobs-db";

export type CreateSessionResult = { jobId: string };
export type SubmitAnswersResult = { jobId: string };
export type CreateNextRoundResult = { jobId: string };
export type AddMoreQuestionsResult = { jobId: string };

export const createSession = action(async (prompt: string) => {
  "use server";
  console.log("actions:createSession", { promptLength: prompt.length });

  const jobs = jobsDb();
  const job = await jobs.createJob("create_session", null);

  processCreateSession(job.id, prompt).catch((err) => {
    console.error("actions:createSession:background error", err);
  });

  return { jobId: job.id } as CreateSessionResult;
}, "session:create");

async function processCreateSession(jobId: string, prompt: string) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processCreateSession:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    const session = await database.createSession(prompt);
    await jobs.updateJob(jobId, { resultSessionId: session.id });

    console.log("processCreateSession:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    let title: string | undefined;
    let description: string | undefined;
    try {
      const meta = await generateTitleAndDescription(prompt);
      title = meta.title;
      description = meta.description;
    } catch (err) {
      console.error("processCreateSession:analyze failed", err);
    }

    console.log("processCreateSession:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    const questions = await generateQuestions(prompt);

    console.log("processCreateSession:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    const round = {
      id: crypto.randomUUID(),
      questions,
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };
    await database.updateSession(session.id, {
      title,
      description,
      rounds: [round],
    });

    console.log("processCreateSession:completed", {
      jobId,
      sessionId: session.id,
    });
    await jobs.completeJob(jobId, session.id);
  } catch (err) {
    console.error("processCreateSession:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}

export const submitAnswers = action(
  async (input: { sessionId: string; answers: Answer[] }) => {
    "use server";
    console.log("actions:submitAnswers", { sessionId: input.sessionId });

    const jobs = jobsDb();
    const job = await jobs.createJob("submit_answers", input.sessionId);

    processSubmitAnswers(job.id, input.sessionId, input.answers).catch(
      (err) => {
        console.error("actions:submitAnswers:background error", err);
      }
    );

    return { jobId: job.id } as SubmitAnswersResult;
  },
  "session:submitAnswers"
);

async function processSubmitAnswers(
  jobId: string,
  sessionId: string,
  answers: Answer[]
) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processSubmitAnswers:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    const session = await database.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];
    currentRound.answers = answers;
    await database.updateSession(sessionId, { rounds });

    console.log("processSubmitAnswers:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    let history = "";
    for (const r of rounds) {
      const rAnswers = r === currentRound ? answers : r.answers;
      const qaPairs = r.questions
        .map((q) => {
          const answer = rAnswers.find((a) => a.questionId === q.id);
          if (!answer) return `Q: ${q.text}\nA: (Skipped)`;

          const selectedTexts = q.options
            .filter((opt) => answer.selectedOptionIds.includes(opt.id))
            .map((opt) => opt.text);

          if (answer.customInput) {
            selectedTexts.push(`Custom: ${answer.customInput}`);
          }

          return `Q: ${q.text}\nA: ${selectedTexts.join(", ")}`;
        })
        .join("\n\n");
      history += `Round ${r.id}:\n${qaPairs}\n\n`;
    }

    console.log("processSubmitAnswers:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    const result = await generateResult(session.prompt, history);

    console.log("processSubmitAnswers:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    currentRound.result = result;
    await database.updateSession(sessionId, { rounds });

    console.log("processSubmitAnswers:completed", { jobId });
    await jobs.completeJob(jobId, sessionId);
  } catch (err) {
    console.error("processSubmitAnswers:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}

export const createNextRound = action(async (sessionId: string) => {
  "use server";
  console.log("actions:createNextRound", { sessionId });

  const jobs = jobsDb();
  const job = await jobs.createJob("create_next_round", sessionId);

  processCreateNextRound(job.id, sessionId).catch((err) => {
    console.error("actions:createNextRound:background error", err);
  });

  return { jobId: job.id } as CreateNextRoundResult;
}, "session:createNextRound");

async function processCreateNextRound(jobId: string, sessionId: string) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processCreateNextRound:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    const session = await database.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    console.log("processCreateNextRound:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    let history = "";
    for (const r of session.rounds) {
      const qaPairs = r.questions
        .map((q) => {
          const answer = r.answers.find((a) => a.questionId === q.id);
          if (!answer) return `Q: ${q.text}\nA: (Skipped)`;

          const selectedTexts = q.options
            .filter((opt) => answer.selectedOptionIds.includes(opt.id))
            .map((opt) => opt.text);

          if (answer.customInput) {
            selectedTexts.push(`Custom: ${answer.customInput}`);
          }

          return `Q: ${q.text}\nA: ${selectedTexts.join(", ")}`;
        })
        .join("\n\n");
      history += `Round ${r.id}:\n${qaPairs}\n\n`;
      if (r.result) {
        history += `Recommendation:\n${r.result}\n\n`;
      }
    }

    console.log("processCreateNextRound:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    const questions = await generateQuestions(session.prompt, history);

    console.log("processCreateNextRound:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    const round = {
      id: crypto.randomUUID(),
      questions,
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };
    const rounds = [...session.rounds, round];
    await database.updateSession(sessionId, { rounds });

    console.log("processCreateNextRound:completed", { jobId });
    await jobs.completeJob(jobId, sessionId);
  } catch (err) {
    console.error("processCreateNextRound:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}

export const addMoreQuestions = action(
  async (input: { sessionId: string; answers: Answer[] }) => {
    "use server";
    console.log("actions:addMoreQuestions", { sessionId: input.sessionId });

    const jobs = jobsDb();
    const job = await jobs.createJob("add_more_questions", input.sessionId);

    processAddMoreQuestions(job.id, input.sessionId, input.answers).catch(
      (err) => {
        console.error("actions:addMoreQuestions:background error", err);
      }
    );

    return { jobId: job.id } as AddMoreQuestionsResult;
  },
  "session:addMoreQuestions"
);

async function processAddMoreQuestions(
  jobId: string,
  sessionId: string,
  answers: Answer[]
) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processAddMoreQuestions:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    const session = await database.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];

    console.log("processAddMoreQuestions:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    const qaPairs = currentRound.questions
      .map((q) => {
        const answer = answers.find((a) => a.questionId === q.id);
        if (!answer || answer.selectedOptionIds.length === 0) {
          return `Q: ${q.text}\nA: (Not yet answered)`;
        }

        const selectedTexts = q.options
          .filter((opt) => answer.selectedOptionIds.includes(opt.id))
          .map((opt) => opt.text);

        if (answer.customInput) {
          selectedTexts.push(`Custom: ${answer.customInput}`);
        }

        return `Q: ${q.text}\nA: ${selectedTexts.join(", ")}`;
      })
      .join("\n\n");

    const history = `Existing questions in this round (do NOT duplicate or rephrase these - generate completely new, orthogonal questions that explore different aspects):\n\n${qaPairs}\n\nGenerate additional questions that cover NEW topics, perspectives, or considerations not already addressed by the existing questions.`;

    console.log("processAddMoreQuestions:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    const newQuestions = await generateQuestions(session.prompt, history);

    console.log("processAddMoreQuestions:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    currentRound.questions = [...currentRound.questions, ...newQuestions];
    currentRound.answers = answers;
    await database.updateSession(sessionId, { rounds });

    console.log("processAddMoreQuestions:completed", { jobId });
    await jobs.completeJob(jobId, sessionId);
  } catch (err) {
    console.error("processAddMoreQuestions:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}

export const getSession = query(async (sessionId: string) => {
  "use server";
  console.log("actions:getSession", { sessionId });
  const database = db();
  const result = await database.getSession(sessionId);
  return result;
}, "session:get");

export const deleteQuestion = action(
  async (input: { sessionId: string; questionId: string }) => {
    "use server";
    console.log("actions:deleteQuestion", {
      sessionId: input.sessionId,
      questionId: input.questionId,
    });

    const database = db();
    const session = await database.getSession(input.sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];

    currentRound.questions = currentRound.questions.filter(
      (q) => q.id !== input.questionId
    );
    currentRound.answers = currentRound.answers.filter(
      (a) => a.questionId !== input.questionId
    );

    await database.updateSession(input.sessionId, { rounds });
    console.log("actions:deleteQuestion completed");

    return { success: true };
  },
  "session:deleteQuestion"
);

export const listSessions = query(async () => {
  "use server";
  const database = db();
  return await database.listSessions();
}, "session:list");
