import { useConsultation } from "./consultation-context";
import { useRoundContent } from "./round-content-context";
import { ADDITIONAL_COMMENTS_QUESTION_ID } from "~/lib/consultation-constants";
import type { Answer } from "~/lib/domain";

type RoundAnswersState = {
  getAnswer: (questionId: string) => Answer | undefined;
  additionalCommentsValue: () => string;
  showAdditionalComments: () => boolean;
  handleAdditionalCommentsChange: (value: string) => void;
  handleAdditionalCommentsBlur: () => void;
};

export function useRoundAnswers(): RoundAnswersState {
  const ctx = useConsultation();
  const content = useRoundContent();

  const getAnswer = (questionId: string) => {
    const roundAnswers = content.round().answers ?? [];
    const localAnswers = ctx.answers ?? [];

    if (content.isLastRound()) {
      const local = localAnswers.find((answer) => answer.questionId === questionId);
      if (local) return local;
      if (roundAnswers.length > 0) {
        return roundAnswers.find((answer) => answer.questionId === questionId);
      }
      return undefined;
    }

    if (roundAnswers.length > 0) {
      return roundAnswers.find((answer) => answer.questionId === questionId);
    }

    return undefined;
  };

  const additionalCommentsAnswer = () =>
    getAnswer(ADDITIONAL_COMMENTS_QUESTION_ID);
  const additionalCommentsValue = () =>
    additionalCommentsAnswer()?.customInput ?? "";
  const showAdditionalComments = () =>
    content.isLastRound() || !!additionalCommentsAnswer();

  const handleAdditionalCommentsChange = (value: string) => {
    if (!content.isLastRound()) return;
    ctx.handleCustomInput(ADDITIONAL_COMMENTS_QUESTION_ID, value);
  };

  const handleAdditionalCommentsBlur = () => {
    if (!content.isLastRound()) return;
    void ctx.handlePersistAnswers();
  };

  return {
    getAnswer,
    additionalCommentsValue,
    showAdditionalComments,
    handleAdditionalCommentsChange,
    handleAdditionalCommentsBlur,
  };
}
