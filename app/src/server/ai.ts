import { generateObject, generateText } from "ai";
import crypto from "node:crypto";
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
      "Missing OPENAI_API_KEY. Set it in your environment to enable AI suggestions.",
    );
  }
}

export async function generateQuestions(
  prompt: string,
  history: string = "",
): Promise<Question[]> {
  requireApiKey();

  const questionTypeSchema = z
    .enum(["goal_discovery", "user_goals", "output_related"])
    .describe(
      "goal_discovery = questions that probe for the user's ultimate objective or underlying goal - what they're really trying to achieve at the highest level. user_goals = questions about specific goals, constraints, and preferences related to their prompt. output_related = questions about the desired format, shape, and structure of the final response.",
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
              }),
            )
            .min(3)
            .max(8),
        }),
      )
      .min(8)
      .max(12),
  });

  const contextPrompt = history
    ? [
        "Full conversation context (questions, answers, prior responses, and any user guidance):",
        history,
        "",
        "This is a follow-up round. Your questions MUST be more focused and intentional than the initial set.",
        "Use ALL context to identify gaps, uncertainties, contradictions, and the user's explicit requests.",
        "Prioritize questions that:",
        "- Clarify ambiguous or missing details that block a confident recommendation.",
        "- Resolve conflicts between earlier answers and the current goal.",
        "- Directly respond to the user's stated questions or feedback.",
        "- Produce NEW information not already captured.",
        "Avoid generic or broad questions already answered or implied by prior context.",
      ].join("\n")
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
      "Generate 10 distinct questions with three types:",
      "",
      "IMPORTANT: Users may skip questions they don't want to answer or delete questions that aren't relevant to them. Design questions that are helpful but not mandatory.",
      "When prior context exists, make the questions tighter, more specific, and clearly tied to that context.",
      "Each question should add incremental clarity rather than restart discovery.",
      "",
      "TYPE 1 - goal_discovery (1-2 questions):",
      "Questions that probe for the user's ultimate objective or underlying goal.",
      "These questions should reveal what the user is REALLY trying to achieve at the highest level.",
      "Examples: What's the bigger picture? What problem are you ultimately trying to solve? What success looks like?",
      "Focus on uncovering the fundamental 'why' behind their request.",
      "",
      "TYPE 2 - user_goals (5-6 questions):",
      "Questions about the user's specific goals, preferences, constraints, context, and requirements.",
      "Examples: budget, timeline, specific preferences, use case, audience, constraints, style.",
      "",
      "TYPE 3 - output_related (2-3 questions):",
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

  return object.questions.map((question) => ({
    id: crypto.randomUUID(),
    text: question.text,
    type: question.type,
    options: question.options.map((option) => ({
      id: crypto.randomUUID(),
      text: option.text,
    })),
  }));
}

export async function generateResult(
  prompt: string,
  history: string,
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
      "Use ALL available context, including prior recommendations and the user's follow-up answers or feedback.",
      "If this is a later-round response, ensure it is more nuanced and clearly influenced by what changed.",
      "Address the user's explicit questions or concerns and explain how new information affected the outcome.",
      "Use markdown formatting.",
      "",
      "IMPORTANT: Do NOT ask questions at the end of your response.",
      "Do NOT offer suggestions like 'What would you like me to do next?' or 'I can help you with...'",
      "Do NOT include meta-commentary about next steps or follow-up options.",
      "Simply provide your analysis and recommendations, then end your response.",
      "The application will provide follow-up options to the user separately.",
    ].join("\n"),
  });

  return text;
}

export async function generateTitleAndDescription(
  prompt: string,
): Promise<{ title: string; description: string }> {
  requireApiKey();

  const schema = z.object({
    title: z
      .string()
      .describe(
        "A concise title for this consultation session (maximum 5 words)",
      ),
    description: z
      .string()
      .describe(
        "A brief description of what the user wants to achieve (maximum 40 words)",
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

export async function generateFocusedPrompt(
  prompt: string,
  history: string,
  focus: string,
): Promise<string> {
  requireApiKey();

  const { text } = await generateText({
    model: getModel(),
    prompt: [
      "You are creating a new consultation prompt based on an existing session.",
      "Summarize the main details of the session and emphasize the user's focus.",
      "Include more context than a short summary, but avoid excessive length.",
      "",
      "Existing prompt:",
      `"${prompt}"`,
      "",
      "Session details:",
      history,
      "",
      "User focus:",
      `"${focus}"`,
      "",
      "Write the new prompt as plain text (no markdown, no bullet lists).",
      "Format it as:",
      "1) A short 'Main request' line at the top.",
      "2) Two short paragraphs that summarize the original context and mention some answered questions.",
      "Keep it concise but more detailed than the previous version.",
      "Return only the prompt text.",
    ].join("\n"),
  });

  return text.trim();
}
