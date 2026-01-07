import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Question, Answer } from "~/lib/domain";

function getModel() {
  const modelId = process.env.AI_MODEL || "gpt-5.2";
  return openai(modelId);
}

function requireApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY. Set it in your environment to enable AI suggestions."
    );
  }
}

export async function generateQuestions(prompt: string): Promise<Question[]> {
  requireApiKey();

  const schema = z.object({
    questions: z
      .array(
        z.object({
          id: z.string(),
          text: z.string().describe("The text of the question"),
          options: z
            .array(
              z.object({
                id: z.string(),
                text: z.string(),
              })
            )
            .min(2)
            .max(5),
        })
      )
      .min(3)
      .max(5),
  });

  const { object } = await generateObject({
    model: getModel(),
    schema,
    prompt: [
      "You are an expert consultant helping a user achieve a goal.",
      "The user has provided the following prompt:",
      `"${prompt}"`,
      "",
      "Generate 3-5 probing multiple-choice questions to better understand their needs and provide a tailored solution.",
      "Ensure the questions cover different aspects of the problem (e.g., specific preferences, budget, constraints, style).",
      "Provide 2-5 distinct options for each question.",
    ].join("\n"),
  });

  return object.questions;
}

export async function generateResult(
  prompt: string,
  questions: Question[],
  answers: Answer[]
): Promise<string> {
  requireApiKey();

  const qaPairs = questions
    .map((q) => {
      const answer = answers.find((a) => a.questionId === q.id);
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

  const { text } = await generateText({
    model: getModel(),
    prompt: [
      "You are an expert consultant.",
      "The user's initial request:",
      `"${prompt}"`,
      "",
      "You asked follow-up questions, and here are the user's answers:",
      qaPairs,
      "",
      "Based on this information, provide a comprehensive, structured, and helpful response/solution.",
      "Use markdown formatting.",
    ].join("\n"),
  });

  return text;
}
