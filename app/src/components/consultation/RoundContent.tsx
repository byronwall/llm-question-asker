import { For, Show } from "solid-js";
import { Stack } from "styled-system/jsx";
import * as Card from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { Round } from "~/lib/domain";
import { useConsultation } from "./consultation-context";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";

type RoundContentProps = {
  round: Round;
  isLastRound: boolean;
};

export function RoundContent(props: RoundContentProps) {
  const ctx = useConsultation();

  const getAnswer = (questionId: string) => {
    // If the round has submitted answers, use those
    if (props.round.answers && props.round.answers.length > 0) {
      return props.round.answers.find((a) => a.questionId === questionId);
    }

    // If this is the current round (last round), use the current answers from context
    if (props.isLastRound) {
      return ctx.answers.find((a) => a.questionId === questionId);
    }

    return undefined;
  };

  return (
    <Card.Root>
      <Card.Body>
        <Stack gap="8">
          <For each={props.round.questions}>
            {(question) => {
              const questionId = () => question.id;
              const answer = () => getAnswer(questionId());
              const disabled = () => !props.isLastRound;

              return (
                <QuestionCard
                  question={question}
                  answer={answer()}
                  disabled={disabled()}
                />
              );
            }}
          </For>

          <Show when={props.round.result}>
            <ResultCard
              result={props.round.result!}
              isLastRound={props.isLastRound}
            />
          </Show>

          <Show when={!props.round.result && props.isLastRound}>
            <Button
              size="lg"
              disabled={ctx.answers.length < props.round.questions.length}
              onClick={ctx.handleSubmitRound}
              loading={ctx.isSubmitting()}
            >
              Submit Answers
            </Button>
          </Show>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
