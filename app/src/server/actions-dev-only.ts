import { action } from "@solidjs/router";

import type { Question } from "~/lib/domain";
import type { CreateSessionResult } from "./actions";
import { db } from "./db";
import { jobsDb } from "./jobs-db";

export type CreateDummySessionResult = CreateSessionResult;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const makeDummyQuestions = (): Question[] => [
  {
    id: crypto.randomUUID(),
    text: "What outcome would make this feel successful?",
    type: "goal_discovery",
    options: [
      { id: crypto.randomUUID(), text: "A clear action plan" },
      { id: crypto.randomUUID(), text: "A short list of next steps" },
      { id: crypto.randomUUID(), text: "A deeper understanding of tradeoffs" },
    ],
  },
  {
    id: crypto.randomUUID(),
    text: "Which constraint matters most right now?",
    type: "user_goals",
    options: [
      { id: crypto.randomUUID(), text: "Budget" },
      { id: crypto.randomUUID(), text: "Timeline" },
      { id: crypto.randomUUID(), text: "Quality bar" },
    ],
  },
  {
    id: crypto.randomUUID(),
    text: "How do you want the result delivered?",
    type: "output_related",
    options: [
      { id: crypto.randomUUID(), text: "Step-by-step guidance" },
      { id: crypto.randomUUID(), text: "Concise summary" },
      { id: crypto.randomUUID(), text: "Decision framework" },
    ],
  },
];

export const createDummySession = action(async (prompt: string) => {
  "use server";
  console.log("actions:createDummySession", { promptLength: prompt.length });

  const database = db();
  const session = await database.createSession(prompt);

  const jobs = jobsDb();
  const job = await jobs.createJob("create_session", session.id);
  await jobs.updateJob(job.id, { resultSessionId: session.id });

  processDummySession(job.id, session.id).catch((err) => {
    console.error("actions:createDummySession:background error", err);
  });

  return { jobId: job.id, sessionId: session.id } as CreateDummySessionResult;
}, "session:createDummy");

async function processDummySession(jobId: string, sessionId: string) {
  const jobs = jobsDb();
  const database = db();

  try {
    console.log("processDummySession:extract", { jobId });
    await jobs.updateJobStage(jobId, "extract");
    await sleep(400);
    const session = await database.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    console.log("processDummySession:analyze", { jobId });
    await jobs.updateJobStage(jobId, "analyze");
    await sleep(400);
    const title = "Sample Consultation";
    const description = "Demo session generated without LLM calls.";

    console.log("processDummySession:generate", { jobId });
    await jobs.updateJobStage(jobId, "generate");
    await sleep(500);
    const questions = makeDummyQuestions();

    console.log("processDummySession:finalize", { jobId });
    await jobs.updateJobStage(jobId, "finalize");
    await sleep(400);
    const round = {
      id: crypto.randomUUID(),
      questions,
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };
    await database.updateSession(sessionId, {
      title,
      description,
      rounds: [round],
    });

    console.log("processDummySession:completed", { jobId, sessionId });
    await jobs.completeJob(jobId, sessionId);
  } catch (err) {
    console.error("processDummySession:failed", { jobId, error: err });
    await jobs.failJob(jobId, String(err));
  }
}
