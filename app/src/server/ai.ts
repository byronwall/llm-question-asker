import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Question } from "~/lib/domain";

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

export async function generateQuestions(
  prompt: string,
  history: string = ""
): Promise<Question[]> {
  requireApiKey();

  const questionTypeSchema = z
    .enum(["user_goals", "output_related"])
    .describe(
      "user_goals = questions about the user's prompt, goals, constraints, preferences. output_related = questions about the desired format, shape, and structure of the final response."
    );

  const schema = z.object({
    questions: z
      .array(
        z.object({
          id: z.string(),
          text: z.string().describe("The text of the question"),
          type: questionTypeSchema,
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
      .min(8)
      .max(12),
  });

  const contextPrompt = history
    ? `Previous conversation history:\n${history}\n\nBased on this history, ask deeper follow-up questions.`
    : "Generate probing multiple-choice questions to better understand their needs and provide a tailored solution.";

  const { object } = await generateObject({
    model: getModel(),
    schema,
    prompt: [
      "You are an expert consultant helping a user achieve a goal.",
      "The user has provided the following prompt:",
      `"${prompt}"`,
      "",
      contextPrompt,
      "",
      "Generate 10 distinct questions with two types:",
      "",
      "IMPORTANT: Users may skip questions they don't want to answer or delete questions that aren't relevant to them. Design questions that are helpful but not mandatory.",
      "",
      "TYPE 1 - user_goals (7-8 questions):",
      "Questions about the user's actual goals, preferences, constraints, context, and requirements.",
      "Examples: budget, timeline, specific preferences, use case, audience, constraints, style.",
      "",
      "TYPE 2 - output_related (2-3 questions):",
      "Questions about how the user wants the final response structured and formatted.",
      "Focus on the SHAPE and FORMAT of the desired output. Possible shapes include:",
      "- Ranked list of options with brief explanations",
      "- Side-by-side comparison table",
      "- Pros and cons analysis",
      "- Step-by-step action plan",
      "- Ideas for further research or exploration",
      "- Executive summary with detailed breakdown",
      "- Decision framework or criteria checklist",
      "Keep these flexible - ask about level of detail, comparison style, and content focus.",
      "",
      "Provide 3-8 distinct options for each question.",
    ].join("\n"),
  });

  return object.questions;
}

export async function generateResult(
  prompt: string,
  history: string
): Promise<string> {
  requireApiKey();

  const { text } = await generateText({
    model: getModel(),
    prompt: [
      "You are an expert consultant.",
      "The user's initial request:",
      `"${prompt}"`,
      "",
      "Here is the detailed Q&A history:",
      history,
      "",
      "Based on this information, provide a comprehensive, structured, and helpful response/solution.",
      "Use markdown formatting.",
    ].join("\n"),
  });

  return text;
}

export async function generateTitleAndDescription(
  prompt: string
): Promise<{ title: string; description: string }> {
  requireApiKey();

  const schema = z.object({
    title: z
      .string()
      .describe(
        "A concise title for this consultation session (maximum 5 words)"
      ),
    description: z
      .string()
      .describe(
        "A brief description of what the user wants to achieve (maximum 40 words)"
      ),
  });

  const { object } = await generateObject({
    model: getModel(),
    schema,
    prompt: [
      "You are creating a title and description for a consultation session.",
      "The user's request:",
      `"${prompt}"`,
      "",
      "Generate a title (max 5 words) and description (max 40 words).",
      "The title should be clear and specific.",
      "The description should summarize the user's goal.",
    ].join("\n"),
  });

  return object;
}
