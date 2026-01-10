import { action, query } from "@solidjs/router";
import type { Answer } from "~/lib/domain";
import { db } from "./db";
import {
  generateQuestions,
  generateResult,
  generateTitleAndDescription,
} from "./ai";

export const createSession = action(async (prompt: string) => {
  "use server";
  console.log("🔧 [SERVER] createSession action called", {
    prompt,
    promptLength: prompt.length,
  });

  const database = await db();

  console.log("💾 [SERVER] Creating session in database");
  const session = await database.createSession(prompt);
  console.log("✅ [SERVER] Session created:", { sessionId: session.id });

  // Generate title and description
  try {
    console.log("🤖 [SERVER] Generating title and description");
    const { title, description } = await generateTitleAndDescription(prompt);
    console.log("✅ [SERVER] Title and description generated:", {
      title,
      description,
    });
    await database.updateSession(session.id, { title, description });
    session.title = title;
    session.description = description;
  } catch (err) {
    console.error("❌ [SERVER] Failed to generate title/description:", err);
  }

  // Generate initial questions in background (or await if fast enough)
  try {
    console.log("🤖 [SERVER] Generating questions for prompt");

    const questions = await generateQuestions(prompt);
    console.log("✅ [SERVER] Questions generated:", {
      count: questions.length,
    });

    const round: any = {
      id: crypto.randomUUID(),
      questions,
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };
    console.log("📦 [SERVER] Created round object:", { roundId: round.id });

    console.log("💾 [SERVER] Updating session with round");
    await database.updateSession(session.id, { rounds: [round] });
    session.rounds = [round];
    console.log("✅ [SERVER] Session updated with round");
  } catch (err) {
    console.error("❌ [SERVER] Failed to generate questions:", err);
  }

  console.log("🎉 [SERVER] Returning session:", {
    sessionId: session.id,
    roundsCount: session.rounds.length,
  });
  return session;
}, "session:create");

export const submitAnswers = action(
  async (input: { sessionId: string; answers: Answer[] }) => {
    "use server";
    const database = await db();
    const session = await database.getSession(input.sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];

    currentRound.answers = input.answers;

    // Update DB with answers first
    await database.updateSession(input.sessionId, { rounds });

    // Generate result based on all history
    try {
      // Construct history string from all rounds
      let history = "";
      for (const r of rounds) {
        const rAnswers = r === currentRound ? input.answers : r.answers; // Use latest answers for current round
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

      const result = await generateResult(session.prompt, history);
      currentRound.result = result;

      await database.updateSession(input.sessionId, { rounds });
      return { success: true, result };
    } catch (err) {
      console.error("Failed to generate result:", err);
      throw err;
    }
  },
  "session:submitAnswers"
);

export const createNextRound = action(async (sessionId: string) => {
  "use server";
  const database = await db();
  const session = await database.getSession(sessionId);
  if (!session) throw new Error("Session not found");

  // Construct history from all rounds
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

  try {
    const questions = await generateQuestions(session.prompt, history);
    const round: any = {
      id: crypto.randomUUID(),
      questions,
      answers: [],
      result: null,
      createdAt: new Date().toISOString(),
    };

    const rounds = [...session.rounds, round];
    await database.updateSession(sessionId, { rounds });
    return round;
  } catch (err) {
    console.error("Failed to generate next round:", err);
    throw err;
  }
}, "session:createNextRound");

export const addMoreQuestions = action(
  async (input: { sessionId: string; answers: Answer[] }) => {
    "use server";
    console.log("🔧 [SERVER] addMoreQuestions action called", {
      sessionId: input.sessionId,
      answersCount: input.answers.length,
    });

    const database = await db();
    const session = await database.getSession(input.sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];

    // Build history from all current round questions (answered or not)
    const qaPairs = currentRound.questions
      .map((q) => {
        const answer = input.answers.find((a) => a.questionId === q.id);
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

    try {
      console.log("🤖 [SERVER] Generating additional questions");
      const newQuestions = await generateQuestions(session.prompt, history);
      console.log("✅ [SERVER] New questions generated:", {
        count: newQuestions.length,
      });

      // Append new questions to current round
      currentRound.questions = [...currentRound.questions, ...newQuestions];

      // Save current answers (partial)
      currentRound.answers = input.answers;

      await database.updateSession(input.sessionId, { rounds });
      console.log("✅ [SERVER] Session updated with additional questions");

      return { success: true, newQuestionsCount: newQuestions.length };
    } catch (err) {
      console.error("❌ [SERVER] Failed to generate additional questions:", err);
      throw err;
    }
  },
  "session:addMoreQuestions"
);

export const getSession = query(async (sessionId: string) => {
  "use server";
  console.log("🔍 [SERVER] getSession called", { sessionId });
  const database = await db();
  const result = await database.getSession(sessionId);
  console.log("🔍 [SERVER] getSession result", {
    sessionId,
    hasResult: !!result,
    result: result ? { id: result.id, roundsCount: result.rounds?.length } : null,
  });
  return result;
}, "session:get");

export const deleteQuestion = action(
  async (input: { sessionId: string; questionId: string }) => {
    "use server";
    console.log("🔧 [SERVER] deleteQuestion action called", {
      sessionId: input.sessionId,
      questionId: input.questionId,
    });

    const database = await db();
    const session = await database.getSession(input.sessionId);
    if (!session) throw new Error("Session not found");

    const rounds = [...session.rounds];
    const currentRoundIndex = rounds.length - 1;
    if (currentRoundIndex < 0) throw new Error("No rounds found");
    const currentRound = rounds[currentRoundIndex];

    // Remove the question from the current round
    currentRound.questions = currentRound.questions.filter(
      (q) => q.id !== input.questionId
    );

    // Also remove any answer associated with this question
    currentRound.answers = currentRound.answers.filter(
      (a) => a.questionId !== input.questionId
    );

    await database.updateSession(input.sessionId, { rounds });
    console.log("✅ [SERVER] Question deleted successfully");

    return { success: true };
  },
  "session:deleteQuestion"
);

export const listSessions = query(async () => {
  "use server";
  const database = await db();
  return await database.listSessions();
}, "session:list");
