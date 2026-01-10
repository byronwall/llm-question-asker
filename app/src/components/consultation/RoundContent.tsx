import { For, Show, createSignal } from "solid-js";
import { Stack, Box, HStack } from "styled-system/jsx";
import { css } from "styled-system/css";
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
  const [questionsExpanded, setQuestionsExpanded] = createSignal(false);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");

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

  const handleToggleQuestions = () => {
    console.log("RoundContent:handleToggleQuestions", !questionsExpanded());
    setQuestionsExpanded(!questionsExpanded());
  };

  const handleCopyMarkdown = async () => {
    console.log("RoundContent:handleCopyMarkdown");
    if (!props.round.result) return;

    try {
      await navigator.clipboard.writeText(props.round.result);
      setCopyButtonText("Copied!");
      setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyButtonText("Failed to copy");
      setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
    }
  };

  const hasResult = () => !!props.round.result;

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "visible",
      })}
    >
      <Card.Root class={css({ overflow: "visible !important" })}>
        <Box
          class={css({
            position: hasResult() && questionsExpanded() ? "sticky" : "static",
            top: 0,
            bg: "white",
            zIndex: 10,
            px: 6,
            pt: 6,
            pb: hasResult() && questionsExpanded() ? 4 : 0,
            borderBottomWidth: hasResult() && questionsExpanded() ? "1px" : "0",
            borderBottomColor: "border.default",
          })}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Card.Title>Questions</Card.Title>
            <Show when={hasResult() && questionsExpanded()}>
              <Button variant="outline" size="sm" onClick={handleToggleQuestions}>
                Hide Questions
              </Button>
            </Show>
          </HStack>
        </Box>

        <Card.Body>
          <Stack gap="6">
            <Box position="relative">
              <Box
                class={css({
                  maxHeight: hasResult() && !questionsExpanded() ? "100px" : "none",
                  overflow: "hidden",
                  position: "relative",
                })}
              >
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
                </Stack>
              </Box>

              <Show when={hasResult() && !questionsExpanded()}>
                <Box
                  class={css({
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "100px",
                    background: "linear-gradient(to bottom, transparent, white)",
                    pointerEvents: "none",
                  })}
                />
              </Show>
            </Box>

            <Show when={hasResult()}>
              <Button variant="outline" onClick={handleToggleQuestions}>
                {questionsExpanded() ? "Hide Questions" : "Show All Questions"}
              </Button>
            </Show>

            <Show when={!props.round.result && props.isLastRound}>
              <HStack gap="4">
                <Button
                  variant="outline"
                  onClick={ctx.handleAddMoreQuestions}
                  loading={ctx.isSubmitting()}
                >
                  Get More Questions
                </Button>
                <Button
                  size="lg"
                  disabled={ctx.answers.length < props.round.questions.length}
                  onClick={ctx.handleSubmitRound}
                  loading={ctx.isSubmitting()}
                >
                  Generate Output
                </Button>
              </HStack>
            </Show>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Show when={props.round.result}>
        <Card.Root>
          <Card.Header>
            <HStack justifyContent="space-between" alignItems="center" w="full">
              <Card.Title>Analysis & Recommendations</Card.Title>
              <Button size="sm" variant="outline" onClick={handleCopyMarkdown}>
                {copyButtonText()}
              </Button>
            </HStack>
          </Card.Header>
          <Card.Body>
            <ResultCard
              result={props.round.result!}
              isLastRound={props.isLastRound}
            />
          </Card.Body>
        </Card.Root>
      </Show>
    </div>
  );
}
