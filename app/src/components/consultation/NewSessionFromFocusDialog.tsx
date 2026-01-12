import { batch, createEffect, Show } from "solid-js";
import { useAction } from "@solidjs/router";
import { Box, HStack, VStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { PlusIcon, XIcon } from "lucide-solid";

import * as Dialog from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { SkeletonText } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { generateSessionPrompt } from "~/server/actions";

import { useConsultation } from "./consultation-context";
import { useJobs } from "~/components/jobs/job-context";

type DialogOpenChangeDetails = {
  open?: boolean;
};

export function NewSessionFromFocusDialog() {
  const ctx = useConsultation();
  const jobsCtx = useJobs();
  const runGenerateSessionPrompt = useAction(generateSessionPrompt);

  const isOpen = () => ctx.focusDialogState.isOpen;
  const focusInput = () => ctx.focusDialogState.focusInput;
  const generatedPrompt = () => ctx.focusDialogState.generatedPrompt;
  const generationError = () => ctx.focusDialogState.generationError;
  const isGenerating = () => ctx.focusDialogState.isGenerating;
  const closeIntent = () => ctx.focusDialogState.closeIntent;

  createEffect(() => {
    console.log("NewSessionFromFocusDialog:state", {
      isOpen: isOpen(),
      isGenerating: isGenerating(),
      hasPrompt: !!generatedPrompt(),
      hasError: !!generationError(),
    });
  });

  const pendingJob = () => {
    const jobId = ctx.pendingJobId();
    if (!jobId) return null;
    return jobsCtx.getJobById(jobId);
  };

  const isCreatingSession = () => {
    const job = pendingJob();
    return job?.type === "create_session";
  };

  const canGeneratePrompt = () =>
    focusInput().trim().length > 0 && !isGenerating() && !isCreatingSession();

  const canCreateSession = () =>
    !!generatedPrompt() && !isGenerating() && !isCreatingSession();

  const resetDialogState = () => {
    batch(() => {
      ctx.setFocusDialogState("focusInput", "");
      ctx.setFocusDialogState("generatedPrompt", null);
      ctx.setFocusDialogState("generationError", null);
      ctx.setFocusDialogState("isGenerating", false);
      ctx.setFocusDialogState("closeIntent", false);
    });
  };

  const handleOpenChange = (details: DialogOpenChangeDetails) => {
    console.log("NewSessionFromFocusDialog:openChange", {
      details,
      isGenerating: isGenerating(),
      hasPrompt: !!generatedPrompt(),
      isCreatingSession: isCreatingSession(),
      closeIntent: closeIntent(),
    });
    if (typeof details?.open !== "boolean") return;
    const nextOpen = !!details.open;
    if (!nextOpen && isCreatingSession()) return;
    if (
      !nextOpen &&
      (isGenerating() || generatedPrompt()) &&
      !closeIntent()
    ) {
      console.log(
        "NewSessionFromFocusDialog:openChange:blocked unexpected close"
      );
      return;
    }
    ctx.setFocusDialogState("isOpen", nextOpen);
    if (!nextOpen) resetDialogState();
    ctx.setFocusDialogState("closeIntent", false);
  };

  const handleGeneratePrompt = async () => {
    const session = ctx.sessionData();
    if (!session) return;

    const focus = focusInput().trim();
    if (!focus) return;

    console.log("NewSessionFromFocusDialog:handleGeneratePrompt", {
      sessionId: session.id,
      focusLength: focus.length,
    });

    batch(() => {
      ctx.setFocusDialogState("isGenerating", true);
      ctx.setFocusDialogState("generatedPrompt", null);
      ctx.setFocusDialogState("generationError", null);
    });

    try {
      const result = await runGenerateSessionPrompt({
        sessionId: session.id,
        focus,
      });
      console.log("NewSessionFromFocusDialog:promptGenerated", {
        promptLength: result.prompt.length,
      });
      ctx.setFocusDialogState("generatedPrompt", result.prompt);
    } catch (error) {
      console.error("NewSessionFromFocusDialog:promptFailed", error);
      ctx.setFocusDialogState(
        "generationError",
        "Failed to generate a new prompt. Try again."
      );
    } finally {
      ctx.setFocusDialogState("isGenerating", false);
    }
  };

  const handleCreateSession = () => {
    const prompt = generatedPrompt();
    if (!prompt) return;
    console.log("NewSessionFromFocusDialog:handleCreateSession");
    void ctx.handleCreateSessionFromPrompt(prompt);
  };

  return (
    <Dialog.Root open={isOpen()} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        asChild={(triggerProps) => (
          <Button
            {...triggerProps}
            variant="outline"
            onClick={() => ctx.setFocusDialogState("isOpen", true)}
          >
            <HStack gap="2" alignItems="center">
              <PlusIcon />
              <span>New Session From This</span>
            </HStack>
          </Button>
        )}
      />

      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          class={css({
            maxW: "720px",
            "--dialog-base-margin": "24px",
            maxH: "80vh",
            overflowY: "auto",
          })}
        >
          <Dialog.Header>
            <Dialog.Title>New Session Focus</Dialog.Title>
            <Dialog.Description>
              Summarize this session and focus on a specific detail you care
              about.
            </Dialog.Description>
          </Dialog.Header>

          <Dialog.CloseTrigger
            aria-label="Close dialog"
            onClick={() => ctx.setFocusDialogState("closeIntent", true)}
          >
            <XIcon />
          </Dialog.CloseTrigger>

          <Dialog.Body class={css({ w: "full" })}>
            <VStack gap="4" alignItems="stretch" w="full">
              <VStack gap="2" alignItems="stretch" w="full">
                <Text fontWeight="semibold">Focus area</Text>
                <Textarea
                  placeholder="e.g., compare budget options, prioritize launch timeline, refine user onboarding details..."
                  value={focusInput()}
                  onInput={(event) =>
                    ctx.setFocusDialogState(
                      "focusInput",
                      event.currentTarget.value
                    )
                  }
                  disabled={isGenerating() || isCreatingSession()}
                  class={css({ minH: "120px", resize: "vertical", w: "full" })}
                />
              </VStack>

              <Show when={isGenerating()}>
                <VStack gap="2" alignItems="stretch">
                  <Text fontWeight="semibold">Generating prompt...</Text>
                  <SkeletonText noOfLines={4} />
                </VStack>
              </Show>

              <Show when={generationError()}>
                <Box
                  class={css({
                    color: "red.surface.fg",
                    bg: "red.surface.bg",
                    borderWidth: "1px",
                    borderColor: "red.surface.border",
                    rounded: "lg",
                    px: "3",
                    py: "2",
                    fontSize: "sm",
                  })}
                >
                  {generationError()}
                </Box>
              </Show>

              <Show when={generatedPrompt() && !isGenerating()}>
                <VStack gap="2" alignItems="stretch" w="full">
                  <Text fontWeight="semibold">Generated prompt</Text>
                  <Box
                    class={css({
                      p: "3",
                      rounded: "md",
                      bg: "gray.50",
                      borderWidth: "1px",
                      borderColor: "border.default",
                      fontSize: "sm",
                      whiteSpace: "pre-wrap",
                      w: "full",
                    })}
                  >
                    {generatedPrompt()}
                  </Box>
                </VStack>
              </Show>

              <Show when={isCreatingSession() && pendingJob()}>
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
                        <Text fontWeight="medium" color="blue.700">
                          {JOB_TYPE_LABELS[job().type]}
                        </Text>
                      </HStack>
                      <JobStageIndicator currentStage={job().stage} />
                      <Text fontSize="sm" color="blue.600">
                        This usually takes 30s-2min. You'll be redirected when
                        ready.
                      </Text>
                    </VStack>
                  </Box>
                )}
              </Show>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack justify="space-between" w="full" gap="2" flexWrap="wrap">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePrompt}
                disabled={!canGeneratePrompt()}
              >
                Generate new prompt
              </Button>
              <HStack gap="2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    ctx.setFocusDialogState("closeIntent", true);
                    ctx.setFocusDialogState("isOpen", false);
                  }}
                  disabled={isGenerating() || isCreatingSession()}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="solid"
                  onClick={handleCreateSession}
                  disabled={!canCreateSession()}
                >
                  Create new session
                </Button>
              </HStack>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
