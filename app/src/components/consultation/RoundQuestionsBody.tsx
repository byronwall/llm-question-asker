import { For, Show } from "solid-js";
import { Box, HStack, Stack, VStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { Spinner } from "~/components/ui/spinner";
import { Button } from "~/components/ui/button";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import {
  ADDITIONAL_COMMENTS_QUESTION_LABEL,
} from "~/lib/consultation-constants";
import { AdditionalCommentsCard } from "./AdditionalCommentsCard";
import { QuestionCard } from "./QuestionCard";
import { QuestionsSkeleton } from "./QuestionsSkeleton";
import { useConsultation } from "./consultation-context";
import { usePendingSessionJob } from "./use-pending-session-job";
import { useRoundAnswers } from "./use-round-answers";
import { useRoundContent } from "./round-content-context";
import { useRoundQuestionsState } from "./use-round-questions";

export function RoundQuestionsBody() {
  const ctx = useConsultation();
  const content = useRoundContent();
  const { hasResult, isRoundEmpty } = useRoundQuestionsState();
  const { pendingJob, isCreatingNextRound, isAddingQuestions } =
    usePendingSessionJob();
  const {
    getAnswer,
    additionalCommentsValue,
    showAdditionalComments,
    handleAdditionalCommentsChange,
    handleAdditionalCommentsBlur,
  } = useRoundAnswers();

  const showQuestionSkeleton = () =>
    content.isLastRound() && isRoundEmpty() && isCreatingNextRound();
  const showAddMoreSkeleton = () =>
    content.isLastRound() && isAddingQuestions();

  return (
    <Stack gap="6">
      <Show when={!content.round().result && content.isLastRound()}>
        <Box
          class={css({
            fontSize: "xs",
            color: "gray.500",
            fontStyle: "italic",
            mb: 2,
          })}
        >
          Tip: You can select multiple options for each question. Questions can
          be skipped if you prefer not to answer them.
        </Box>
      </Show>

      <Show
        when={!showQuestionSkeleton()}
        fallback={
          <QuestionsSkeleton
            withCard={false}
            description="Generating the next round of questions..."
          />
        }
      >
        <Stack gap="8">
          <For each={content.round().questions}>
            {(question, index) => {
              const questionId = () => question.id;
              const answer = () => getAnswer(questionId());
              const disabled = () => !content.isLastRound();
              const position = () => index() + 1;

              return (
                <QuestionCard
                  question={question}
                  answer={answer()}
                  disabled={disabled()}
                  hasResult={hasResult()}
                  position={position()}
                />
              );
            }}
          </For>
          <Show when={showAdditionalComments()}>
            <AdditionalCommentsCard
              label={ADDITIONAL_COMMENTS_QUESTION_LABEL}
              value={additionalCommentsValue()}
              disabled={!content.isLastRound()}
              onChange={handleAdditionalCommentsChange}
              onBlur={handleAdditionalCommentsBlur}
            />
          </Show>
        </Stack>
      </Show>

      <Show when={showAddMoreSkeleton() && pendingJob()}>
        {(job) => (
          <Box
            class={css({
              p: "4",
              rounded: "lg",
              bg: "gray.50",
              border: "1px solid",
              borderColor: "gray.200",
            })}
          >
            <VStack gap="3" alignItems="stretch">
              <HStack gap="2">
                <Spinner size="sm" />
                <Box fontWeight="medium" color="gray.700">
                  {JOB_TYPE_LABELS[job().type]}
                </Box>
              </HStack>
              <JobStageIndicator currentStage={job().stage} />
              <QuestionsSkeleton
                withCard={false}
                count={2}
                description="Adding more questions..."
              />
            </VStack>
          </Box>
        )}
      </Show>

      <Show when={!content.round().result && content.isLastRound()}>
        <HStack gap="4" flexWrap="wrap" w="full">
          <Button
            variant="outline"
            onClick={ctx.handleAddMoreQuestions}
            loading={ctx.isSubmitting()}
          >
            Get More Questions
          </Button>
          <Button
            size="lg"
            onClick={ctx.handleSubmitRound}
            loading={ctx.isSubmitting()}
          >
            Generate Output
          </Button>
        </HStack>
      </Show>
    </Stack>
  );
}
