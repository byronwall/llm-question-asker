import { action, cache, query } from "@solidjs/router";
import { generateQuestions, generateResult } from "./ai";
import { db } from "./db";
import type { Answer } from "~/lib/domain";

export const createSession = action(async (prompt: string) => {
  "use server";
  const session = await db().createSession(prompt);

  // Generate initial questions in background (or await if fast enough)
  try {
    const questions = await generateQuestions(prompt);
    await db().updateSession(session.id, { questions });
    session.questions = questions;
  } catch (err) {
    console.error("Failed to generate questions:", err);
    // You might want to handle this gracefully, e.g. return an error state
  }

  return session;
}, "session:create");

export const submitAnswers = action(
  async (input: { sessionId: string; answers: Answer[] }) => {
    "use server";
    const session = await db().getSession(input.sessionId);
    if (!session) throw new Error("Session not found");

    await db().updateSession(input.sessionId, { answers: input.answers });

    // Generate result
    try {
      const result = await generateResult(
        session.prompt,
        session.questions,
        input.answers
      );
      await db().updateSession(input.sessionId, { result });
      return { success: true, result };
    } catch (err) {
      console.error("Failed to generate result:", err);
      throw err;
    }
  },
  "session:submitAnswers"
);

export const getSession = query(async (sessionId: string) => {
  "use server";
  return await db().getSession(sessionId);
}, "session:get");
