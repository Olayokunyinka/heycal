export function parseEventQuestions(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const questions: unknown = JSON.parse(value);
    return Array.isArray(questions)
      ? questions.filter((question): question is string => typeof question === "string" && question.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export function serializeEventQuestions(value: string | undefined): string {
  const questions = (value ?? "")
    .split(/\r?\n/)
    .map((question) => question.trim())
    .filter(Boolean);

  return JSON.stringify(questions);
}

export function parseGuestAnswers(value: string | null | undefined): { question: string; answer: string }[] {
  if (!value) return [];

  try {
    const answers: unknown = JSON.parse(value);
    return Array.isArray(answers)
      ? answers.filter((item): item is { question: string; answer: string } => (
          typeof item === "object"
          && item !== null
          && "question" in item
          && typeof item.question === "string"
          && "answer" in item
          && typeof item.answer === "string"
        ))
      : [];
  } catch {
    return [];
  }
}