import { Show, createMemo } from "solid-js";
import { TriangleAlertIcon, XIcon } from "lucide-solid";
import { css } from "styled-system/css";
import { VStack, HStack, Box } from "styled-system/jsx";

import type { Job } from "~/lib/job-types";
import {
  JOB_TYPE_LABELS,
  JOB_ETA_BANDS,
  STALL_THRESHOLD_MS,
  getStageProgress,
} from "~/lib/job-types";
import * as Progress from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { JobStageIndicator } from "./JobStageIndicator";

type Props = {
  job: Job;
  onCancel?: (jobId: string) => void;
};

export function JobCard(props: Props) {
  const label = () => JOB_TYPE_LABELS[props.job.type];
  const etaBand = () => JOB_ETA_BANDS[props.job.type];
  const progress = () => getStageProgress(props.job.stage);

  const isStalled = createMemo(() => {
    if (!props.job.stageStartedAt) return false;
    const stageStart = new Date(props.job.stageStartedAt).getTime();
    return Date.now() - stageStart > STALL_THRESHOLD_MS;
  });

  const isFailed = () => props.job.stage === "failed";
  const isPending = () => props.job.stage === "pending";
  const canCancel = () => isPending();

  const handleCancel = () => {
    props.onCancel?.(props.job.id);
  };

  return (
    <Box
      class={css({
        p: "3",
        rounded: "md",
        border: "1px solid",
        borderColor: isFailed() ? "red.200" : "gray.200",
        bg: isFailed() ? "red.50" : "white",
      })}
    >
      <VStack gap="2" alignItems="stretch">
        <HStack justify="space-between">
          <HStack gap="2">
            <Show when={!isFailed()}>
              <Spinner size="sm" />
            </Show>
            <Show when={isFailed()}>
              <TriangleAlertIcon size={16} class={css({ color: "red.500" })} />
            </Show>
            <span class={css({ fontWeight: "medium", fontSize: "sm" })}>
              {label()}
            </span>
          </HStack>
          <Show when={canCancel() && props.onCancel}>
            <Button size="xs" variant="plain" onClick={handleCancel}>
              <XIcon size={14} />
            </Button>
          </Show>
        </HStack>

        <Show when={!isFailed()}>
          <JobStageIndicator currentStage={props.job.stage} />

          <Progress.Root value={progress()} size="sm">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>

          <HStack justify="space-between">
            <span class={css({ fontSize: "xs", color: "gray.500" })}>
              {etaBand().label}
            </span>
            <span class={css({ fontSize: "xs", color: "gray.500" })}>
              {progress()}%
            </span>
          </HStack>

          <Show when={isStalled()}>
            <Box
              class={css({
                p: "2",
                rounded: "md",
                bg: "amber.50",
                border: "1px solid",
                borderColor: "amber.200",
                fontSize: "xs",
                color: "amber.700",
              })}
            >
              Still working on this step...
            </Box>
          </Show>
        </Show>

        <Show when={isFailed()}>
          <Box
            class={css({
              p: "2",
              rounded: "md",
              bg: "red.100",
              fontSize: "xs",
              color: "red.700",
            })}
          >
            {props.job.error ?? "An error occurred"}
          </Box>
        </Show>
      </VStack>
    </Box>
  );
}
