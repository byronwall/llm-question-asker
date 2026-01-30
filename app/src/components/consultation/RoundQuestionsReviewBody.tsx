import { For, Show } from "solid-js";
import { Stack } from "styled-system/jsx";
import { ADDITIONAL_COMMENTS_QUESTION_LABEL } from "~/lib/consultation-constants";
import { AdditionalCommentsCard } from "./AdditionalCommentsCard";
import { QuestionCard } from "./QuestionCard";
import { useRoundAnswers } from "./use-round-answers";
import { useRoundContent } from "./round-content-context";

export function RoundQuestionsReviewBody() {
  const content = useRoundContent();
  const { getAnswer, additionalCommentsValue, showAdditionalComments } =
    useRoundAnswers();

  const handleReadonlyChange = (_value: string) => {};
  const handleReadonlyBlur = () => {};

  return (
    <Stack gap="8">
      <For each={content.round().questions}>
        {(question, index) => {
          const questionId = () => question.id;
          const answer = () => getAnswer(questionId());
          const position = () => index() + 1;

          return (
            <QuestionCard
              question={question}
              answer={answer()}
              disabled={true}
              hasResult={!!content.round().result}
              position={position()}
            />
          );
        }}
      </For>
      <Show when={showAdditionalComments()}>
        <AdditionalCommentsCard
          label={ADDITIONAL_COMMENTS_QUESTION_LABEL}
          value={additionalCommentsValue()}
          disabled={true}
          onChange={handleReadonlyChange}
          onBlur={handleReadonlyBlur}
        />
      </Show>
    </Stack>
  );
}
