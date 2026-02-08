type ErrorLike = {
  message?: string;
  cause?: unknown;
  statusCode?: number;
  status?: number;
  code?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const maybeError = error as ErrorLike;
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
    return JSON.stringify(error);
  }
  return String(error);
}

function matchesOpenAiCreditError(input: string): boolean {
  const value = input.toLowerCase();
  return (
    value.includes("insufficient_quota") ||
    value.includes("insufficient quota") ||
    value.includes("rate_limit_exceeded") ||
    value.includes("billing") ||
    value.includes("credits")
  );
}

export function normalizeOpenAiErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  if (matchesOpenAiCreditError(message)) {
    return "OpenAI credits are exhausted or billing is unavailable. Add credits, then retry.";
  }
  return message;
}

