import { Show, createEffect } from "solid-js";
import { css } from "styled-system/css";
import { Stack, VStack, HStack, Box } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { Spinner } from "~/components/ui/spinner";
import { SITE_DESCRIPTION, SITE_NAME } from "~/lib/site-meta";
import { useConsultation } from "./consultation-context";
import { useJobs } from "~/components/jobs/job-context";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";

export function WelcomeCard() {
  const ctx = useConsultation();
  const jobsCtx = useJobs();
  let promptRef: HTMLTextAreaElement | undefined;

  const pendingJob = () => {
    const jobId = ctx.pendingJobId();
    if (!jobId) return null;
    return jobsCtx.getJobById(jobId);
  };

  const resizePrompt = (target?: HTMLTextAreaElement) => {
    const element = target ?? promptRef;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const handlePromptInput = (event: InputEvent) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    ctx.setPrompt(target.value);
    resizePrompt(target);
  };

  createEffect(() => {
    ctx.prompt();
    resizePrompt();
  });

  return (
    <Stack gap="6">
      <Stack gap="2">
        <Heading as="h1" class={css({ fontSize: "3xl", fontWeight: "bold" })}>
          {SITE_NAME}
        </Heading>
        <Text class={css({ fontSize: "lg", color: "fg.muted" })}>
          {SITE_DESCRIPTION}
        </Text>
      </Stack>

      <Stack gap="4">
        <VStack gap="2" alignItems="stretch">
          <Text fontWeight="bold" fontSize="xl">
            What are you looking to achieve?
          </Text>
          <Textarea
            placeholder="e.g., I want to build a mobile app for sustainable grocery shopping..."
            rows={4}
            value={ctx.prompt()}
            onInput={handlePromptInput}
            ref={promptRef}
            disabled={ctx.isSubmitting()}
          />
        </VStack>

        <Button
          class={css({ py: 5, fontSize: "lg", alignSelf: "flex-start" })}
          loading={ctx.isSubmitting()}
          onClick={ctx.handleCreateSession}
        >
          Start Consultation
        </Button>

        <Show when={ctx.isSubmitting() && pendingJob()}>
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
                    Creating your consultation...
                  </Text>
                </HStack>
                <JobStageIndicator currentStage={job().stage} />
                <Text fontSize="sm" color="blue.600">
                  This usually takes 30s-2min. Loading your session now.
                </Text>
              </VStack>
            </Box>
          )}
        </Show>
      </Stack>
    </Stack>
  );
}
