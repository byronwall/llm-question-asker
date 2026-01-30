import { Show } from "solid-js";
import { Box, HStack, VStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import * as Card from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { usePendingSessionJob } from "./use-pending-session-job";

export function RoundGeneratingResultSection() {
  const { pendingJob, isGeneratingResult } = usePendingSessionJob();

  return (
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
  );
}
