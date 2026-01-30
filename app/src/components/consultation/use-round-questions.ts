import { useConsultation } from "./consultation-context";
import { useRoundContent } from "./round-content-context";

type RoundQuestionsState = {
  hasResult: () => boolean;
  isRoundEmpty: () => boolean;
  canCollapseQuestions: () => boolean;
  questionCount: () => number;
  answeredCount: () => number;
  hasQuestionsWaiting: () => boolean;
  questionsAnswered: () => boolean;
  questionsHeaderMeta: () => string;
};

export function useRoundQuestionsState(): RoundQuestionsState {
  const ctx = useConsultation();
  const content = useRoundContent();

  const hasResult = () => !!content.round().result;
  const questionCount = () => content.round().questions.length;
  const isRoundEmpty = () => questionCount() === 0;
  const canCollapseQuestions = () => hasResult();

  const answeredCount = () => {
    const count =
      content.round().answers.length > 0
        ? content.round().answers.length
        : ctx.answers.length;
    return Math.min(count, questionCount());
  };

  const hasQuestionsWaiting = () =>
    questionCount() > 0 && answeredCount() < questionCount();
  const questionsAnswered = () =>
    questionCount() > 0 && answeredCount() === questionCount();

  const questionsHeaderMeta = () => {
    if (questionCount() === 0) return "No questions yet";
    if (hasResult()) return `${questionCount()} questions`;
    if (hasQuestionsWaiting()) {
      return `${answeredCount()}/${questionCount()} answered`;
    }
    return `${questionCount()} questions`;
  };

  return {
    hasResult,
    isRoundEmpty,
    canCollapseQuestions,
    questionCount,
    answeredCount,
    hasQuestionsWaiting,
    questionsAnswered,
    questionsHeaderMeta,
  };
}
