import { For, Show, batch, createEffect, createSignal } from "solid-js";
import { Stack, Box, HStack, VStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import {
  CopyIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-solid";
import * as Card from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import * as Collapsible from "~/components/ui/collapsible";
import * as Dialog from "~/components/ui/dialog";
import type { Round } from "~/lib/domain";
import {
  ADDITIONAL_COMMENTS_QUESTION_ID,
  ADDITIONAL_COMMENTS_QUESTION_LABEL,
} from "~/lib/consultation-constants";
import {
  exportRoundAsMarkdown,
  downloadMarkdown,
  sanitizeFilename,
} from "~/lib/markdown-export";
import { SITE_NAME } from "~/lib/site-meta";
import { useConsultation } from "./consultation-context";
import { useJobs } from "~/components/jobs/job-context";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { QuestionCard } from "./QuestionCard";
import { ResultCard } from "./ResultCard";
import { AdditionalCommentsCard } from "./AdditionalCommentsCard";
import { QuestionsSkeleton } from "./QuestionsSkeleton";
import { PromptDialog } from "./PromptDialog";

type RoundContentProps = {
  round: Round;
  isLastRound: boolean;
  prompt: string;
  showPromptTrigger: boolean;
};

export function RoundContent(props: RoundContentProps) {
  const ctx = useConsultation();
  const jobsCtx = useJobs();
  const [questionsExpanded, setQuestionsExpanded] = createSignal(false);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");
  const [copyRoundButtonText, setCopyRoundButtonText] =
    createSignal("Copy as Markdown");

  const pendingJob = () => {
    const jobId = ctx.pendingJobId();
    if (jobId) {
      return jobsCtx.getJobById(jobId);
    }
    const session = ctx.sessionData();
    if (!session) return null;
    return jobsCtx.jobs().find((job) => job.sessionId === session.id) ?? null;
  };

  const isGeneratingResult = () => {
    const job = pendingJob();
    return job?.type === "submit_answers";
  };

  const isAddingQuestions = () => {
    const job = pendingJob();
    return job?.type === "add_more_questions";
  };

  const isCreatingNextRound = () => {
    const job = pendingJob();
    return job?.type === "create_next_round";
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
  const isRoundEmpty = () => props.round.questions.length === 0;
  const canCollapseQuestions = () => hasResult();
  const showQuestionSkeleton = () =>
    props.isLastRound && isRoundEmpty() && isCreatingNextRound();
  const showAddMoreSkeleton = () => props.isLastRound && isAddingQuestions();
  const additionalCommentsAnswer = () =>
    getAnswer(ADDITIONAL_COMMENTS_QUESTION_ID);
  const additionalCommentsValue = () =>
    additionalCommentsAnswer()?.customInput ?? "";
  const showAdditionalComments = () =>
    props.isLastRound || !!additionalCommentsAnswer();
  const handleAdditionalCommentsChange = (value: string) => {
    if (!props.isLastRound) return;
    ctx.handleCustomInput(ADDITIONAL_COMMENTS_QUESTION_ID, value);
  };
  const handleAdditionalCommentsReadonlyChange = (_value: string) => {};

  const handleExportRound = () => {
    console.log("RoundContent:handleExportRound");
    const session = ctx.sessionData();
    if (!session) return;

    const roundIndex = session.rounds.findIndex((r) => r.id === props.round.id);
    const roundNumber = roundIndex >= 0 ? roundIndex + 1 : undefined;
    const sessionTitle = session.title || `Session ${session.id.slice(0, 8)}`;

    const markdown = exportRoundAsMarkdown(props.round, roundNumber);
    const filename = sanitizeFilename(
      `${SITE_NAME} - ${sessionTitle} - Round ${roundNumber ?? "export"}.md`
    );

    downloadMarkdown(markdown, filename);
  };

  const handleCopyRound = async () => {
    console.log("RoundContent:handleCopyRound");
    const session = ctx.sessionData();
    if (!session) return;

    const roundIndex = session.rounds.findIndex((r) => r.id === props.round.id);
    const roundNumber = roundIndex >= 0 ? roundIndex + 1 : undefined;

    const markdown = exportRoundAsMarkdown(props.round, roundNumber);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopyRoundButtonText("Copied!");
      setTimeout(() => setCopyRoundButtonText("Copy as Markdown"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyRoundButtonText("Failed to copy");
      setTimeout(() => setCopyRoundButtonText("Copy as Markdown"), 2000);
    }
  };

  createEffect(() => {
    if (!hasResult()) {
      if (!questionsExpanded()) {
        setQuestionsExpanded(true);
      }
      return;
    }
    if (questionsExpanded()) {
      console.log("RoundContent:collapseQuestions");
      setQuestionsExpanded(false);
    }
  });

  const handleQuestionsOpenChange: NonNullable<
    Collapsible.RootProps["onOpenChange"]
  > = (details) => {
    if (!canCollapseQuestions()) return;
    console.log("RoundContent:questionsOpenChange", { open: details.open });
    setQuestionsExpanded(details.open);
  };

  const answeredCount = () => {
    const count =
      props.round.answers.length > 0
        ? props.round.answers.length
        : ctx.answers.length;
    return Math.min(count, props.round.questions.length);
  };
  const questionCount = () => props.round.questions.length;
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

  const questionsOpen = () =>
    canCollapseQuestions() ? questionsExpanded() : true;

  const showQuestionsDialog = () => hasResult();
  const showSupportingActions = () =>
    props.showPromptTrigger || showQuestionsDialog();

  const renderQuestionsBody = () => (
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
          <Show when={showAdditionalComments()}>
            <AdditionalCommentsCard
              label={ADDITIONAL_COMMENTS_QUESTION_LABEL}
              value={additionalCommentsValue()}
              disabled={!props.isLastRound}
              onChange={handleAdditionalCommentsChange}
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

      <Show when={!props.round.result && props.isLastRound}>
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

  const renderQuestionsReviewBody = () => (
    <Stack gap="8">
      <For each={props.round.questions}>
        {(question) => {
          const questionId = () => question.id;
          const answer = () => getAnswer(questionId());
          const disabled = () => true;

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
      <Show when={showAdditionalComments()}>
        <AdditionalCommentsCard
          label={ADDITIONAL_COMMENTS_QUESTION_LABEL}
          value={additionalCommentsValue()}
          disabled={true}
          onChange={handleAdditionalCommentsReadonlyChange}
        />
      </Show>
    </Stack>
  );

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "visible",
      })}
    >
      <Show when={showSupportingActions()}>
        <HStack gap="2" flexWrap="wrap">
          <Show when={props.showPromptTrigger}>
            <PromptDialog prompt={props.prompt} />
          </Show>
          <Show when={showQuestionsDialog()}>
            <Dialog.Root>
              <Dialog.Trigger
                asChild={(triggerProps) => (
                  <Button {...triggerProps} variant="outline" size="sm">
                    View questions ({questionCount()})
                  </Button>
                )}
              />
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content
                  class={css({
                    maxW: "880px",
                    "--dialog-base-margin": "24px",
                    maxH: "80vh",
                    overflowY: "auto",
                  })}
                >
                  <Dialog.Header>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Stack gap="1">
                        <Dialog.Title>Questions</Dialog.Title>
                        <Dialog.Description>
                          {questionsHeaderMeta()}
                        </Dialog.Description>
                      </Stack>
                      <Menu.Root size="sm">
                        <Menu.Trigger
                          asChild={(triggerProps) => (
                            <IconButton
                              {...triggerProps}
                              size="xs"
                              variant="plain"
                              aria-label="Questions actions"
                            >
                              <MoreVerticalIcon />
                            </IconButton>
                          )}
                        />
                        <Menu.Positioner>
                          <Menu.Content class={css({ minW: "220px" })}>
                            <Menu.Item
                              value="copy-round"
                              onSelect={() => void handleCopyRound()}
                            >
                              <HStack gap="2" alignItems="center">
                                <CopyIcon />
                                <Box>{copyRoundButtonText()}</Box>
                              </HStack>
                            </Menu.Item>
                            <Menu.Item
                              value="export-round"
                              onSelect={handleExportRound}
                            >
                              <HStack gap="2" alignItems="center">
                                <DownloadIcon />
                                <Box>Export as Markdown</Box>
                              </HStack>
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Menu.Root>
                    </HStack>
                  </Dialog.Header>
                  <Dialog.CloseTrigger aria-label="Close questions">
                    <XIcon />
                  </Dialog.CloseTrigger>
                  <Dialog.Body class={css({ w: "full" })}>
                    {renderQuestionsReviewBody()}
                  </Dialog.Body>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          </Show>
        </HStack>
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
                    <Menu.Item
                      value="export-round"
                      onSelect={handleExportRound}
                    >
                      <HStack gap="2" alignItems="center">
                        <DownloadIcon />
                        <Box>Export as Markdown</Box>
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

      <Show
        when={showQuestionsDialog()}
        fallback={
          <Collapsible.Root
            open={questionsOpen()}
            onOpenChange={handleQuestionsOpenChange}
          >
            <Card.Root class={css({ overflow: "visible !important" })}>
              <Box
                class={css({
                  position:
                    hasResult() && questionsExpanded() ? "sticky" : "static",
                  top: 0,
                  bg: "white",
                  zIndex: 10,
                  px: 6,
                  pt: 6,
                  pb: hasResult() && questionsExpanded() ? 4 : 0,
                  borderBottomWidth:
                    hasResult() && questionsExpanded() ? "1px" : "0",
                  borderBottomColor: "border.default",
                })}
              >
                <HStack
                  justifyContent="space-between"
                  alignItems="center"
                  w="full"
                >
                  <Stack gap="1">
                    <Card.Title>Questions</Card.Title>
                    <Box
                      class={css({
                        fontSize: "xs",
                        color: "gray.500",
                      })}
                    >
                      {questionsHeaderMeta()}
                    </Box>
                  </Stack>
                  <HStack gap="2">
                    <Show when={canCollapseQuestions()}>
                      <Collapsible.Trigger
                        asChild={(triggerProps) => (
                          <Button
                            {...triggerProps}
                            variant="outline"
                            size="sm"
                          >
                            {questionsExpanded()
                              ? "Hide Questions"
                              : "Show Questions"}
                          </Button>
                        )}
                      />
                    </Show>
                    <Menu.Root size="sm">
                      <Menu.Trigger
                        asChild={(triggerProps) => (
                          <IconButton
                            {...triggerProps}
                            size="xs"
                            variant="plain"
                            aria-label="Questions actions"
                          >
                            <MoreVerticalIcon />
                          </IconButton>
                        )}
                      />
                      <Menu.Positioner>
                        <Menu.Content class={css({ minW: "220px" })}>
                          <Menu.Item
                            value="copy-round"
                            onSelect={() => void handleCopyRound()}
                          >
                            <HStack gap="2" alignItems="center">
                              <CopyIcon />
                              <Box>{copyRoundButtonText()}</Box>
                            </HStack>
                          </Menu.Item>
                          <Menu.Item
                            value="export-round"
                            onSelect={handleExportRound}
                          >
                            <HStack gap="2" alignItems="center">
                              <DownloadIcon />
                              <Box>Export as Markdown</Box>
                            </HStack>
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  </HStack>
                </HStack>
              </Box>

              <Show
                when={canCollapseQuestions()}
                fallback={<Card.Body>{renderQuestionsBody()}</Card.Body>}
              >
                <Collapsible.Content>
                  <Card.Body>{renderQuestionsBody()}</Card.Body>
                </Collapsible.Content>
              </Show>
            </Card.Root>
          </Collapsible.Root>
        }
      />

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

    </div>
  );
}
