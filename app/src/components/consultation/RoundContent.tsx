import { For, Show, batch, createSignal } from "solid-js";
import { Stack, Box, HStack, VStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { CopyIcon, MoreVerticalIcon, PlusIcon, RefreshCwIcon } from "lucide-solid";
import * as Card from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import type { Round } from "~/lib/domain";
import { useConsultation } from "./consultation-context";
import { useJobs } from "~/components/jobs/job-context";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";

type RoundContentProps = {
  round: Round;
  isLastRound: boolean;
};

export function RoundContent(props: RoundContentProps) {
  const ctx = useConsultation();
  const jobsCtx = useJobs();
  const [questionsExpanded, setQuestionsExpanded] = createSignal(false);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");

  const pendingJob = () => {
    const jobId = ctx.pendingJobId();
    if (!jobId) return null;
    return jobsCtx.getJobById(jobId);
  };

  const isGeneratingResult = () => {
    const job = pendingJob();
    return job?.type === "submit_answers";
  };

  const isAddingQuestions = () => {
    const job = pendingJob();
    return job?.type === "add_more_questions";
  };

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

  const handleOpenNewSessionDialog = () => {
    console.log("RoundContent:handleOpenNewSessionDialog");
    batch(() => {
      ctx.setFocusDialogState("closeIntent", false);
      ctx.setFocusDialogState("isOpen", true);
    });
  };

  const handleRefineRound = () => {
    console.log("RoundContent:handleRefineRound");
    void ctx.handleCreateNextRound();
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleQuestions}
              >
                Hide Questions
              </Button>
            </Show>
          </HStack>
        </Box>

        <Card.Body>
          <Stack gap="6">
            <Show when={!props.round.result && props.isLastRound}>
              <Box
                class={css({
                  fontSize: "xs",
                  color: "gray.500",
                  fontStyle: "italic",
                  mb: 2,
                })}
              >
                Tip: You can select multiple options for each question.
                Questions can be skipped if you prefer not to answer them.
              </Box>
            </Show>

            <Box position="relative">
              <Box
                class={css({
                  maxHeight:
                    hasResult() && !questionsExpanded() ? "100px" : "none",
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
                          hasResult={hasResult()}
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
                    background:
                      "linear-gradient(to bottom, transparent, white)",
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

            <Show when={isAddingQuestions() && pendingJob()}>
              {(job) => (
                <Box
                  class={css({
                    p: "4",
                    rounded: "lg",
                    bg: "blue.50",
                    border: "1px solid",
                    borderColor: "blue.200",
                  })}
                >
                  <VStack gap="3" alignItems="stretch">
                    <HStack gap="2">
                      <Spinner size="sm" />
                      <Box fontWeight="medium" color="blue.700">
                        {JOB_TYPE_LABELS[job().type]}
                      </Box>
                    </HStack>
                    <JobStageIndicator currentStage={job().stage} />
                    <Box fontSize="sm" color="blue.600">
                      Generating additional questions...
                    </Box>
                  </VStack>
                </Box>
              )}
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

      <Show when={isGeneratingResult() && pendingJob()}>
        {(job) => (
          <Card.Root>
            <Card.Header>
              <Card.Title>
                <HStack gap="2">
                  <Spinner size="sm" />
                  <span>{JOB_TYPE_LABELS[job().type]}</span>
                </HStack>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <VStack gap="4" alignItems="stretch">
                <JobStageIndicator currentStage={job().stage} />
                <Box
                  class={css({
                    p: "4",
                    bg: "gray.50",
                    rounded: "md",
                    minH: "200px",
                  })}
                >
                  <VStack
                    gap="3"
                    alignItems="center"
                    justifyContent="center"
                    h="full"
                  >
                    <Box
                      class={css({
                        w: "full",
                        h: "4",
                        bg: "gray.200",
                        rounded: "md",
                        animation: "pulse 2s infinite",
                      })}
                    />
                    <Box
                      class={css({
                        w: "80%",
                        h: "4",
                        bg: "gray.200",
                        rounded: "md",
                        animation: "pulse 2s infinite",
                      })}
                    />
                    <Box
                      class={css({
                        w: "60%",
                        h: "4",
                        bg: "gray.200",
                        rounded: "md",
                        animation: "pulse 2s infinite",
                      })}
                    />
                  </VStack>
                </Box>
                <Box
                  class={css({
                    fontSize: "sm",
                    color: "gray.500",
                    textAlign: "center",
                  })}
                >
                  Generating your personalized analysis and recommendations...
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </Show>

      <Show when={props.round.result}>
        <Card.Root>
          <Card.Header>
            <HStack justifyContent="space-between" alignItems="center" w="full">
              <Card.Title>Analysis & Recommendations</Card.Title>
              <Menu.Root size="sm">
                <Menu.Trigger
                  asChild={(triggerProps) => (
                    <IconButton
                      {...triggerProps}
                      size="xs"
                      variant="plain"
                      aria-label="Result actions"
                    >
                      <MoreVerticalIcon />
                    </IconButton>
                  )}
                />
                <Menu.Positioner>
                  <Menu.Content class={css({ minW: "220px" })}>
                    <Menu.Item
                      value="copy-markdown"
                      onSelect={() => void handleCopyMarkdown()}
                    >
                      <HStack gap="2" alignItems="center">
                        <CopyIcon />
                        <Box>{copyButtonText()}</Box>
                      </HStack>
                    </Menu.Item>
                    <Show when={props.isLastRound}>
                      <Menu.Separator />
                      <Menu.Item
                        value="refine-round"
                        onSelect={handleRefineRound}
                        disabled={ctx.isSubmitting()}
                      >
                        <HStack gap="2" alignItems="center">
                          <RefreshCwIcon />
                          <Box>Refine with Another Round</Box>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item
                        value="create-session"
                        onSelect={handleOpenNewSessionDialog}
                        disabled={ctx.isSubmitting()}
                      >
                        <HStack gap="2" alignItems="center">
                          <PlusIcon />
                          <Box>Create new session</Box>
                        </HStack>
                      </Menu.Item>
                    </Show>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
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
