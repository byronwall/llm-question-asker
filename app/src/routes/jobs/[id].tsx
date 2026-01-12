import { Show, Suspense } from "solid-js";
import { A, useParams } from "@solidjs/router";
import { createAsync } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";
import { css } from "styled-system/css";
import { VStack, HStack, Box, Container } from "styled-system/jsx";

import { getJob } from "~/server/job-actions";
import { JobStageIndicator } from "~/components/jobs/JobStageIndicator";
import * as Progress from "~/components/ui/progress";
import {
  JOB_TYPE_LABELS,
  JOB_ETA_BANDS,
  getStageProgress,
  isActiveStage,
} from "~/lib/job-types";
import { Spinner } from "~/components/ui/spinner";
import { formatPageTitle } from "~/lib/site-meta";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const job = createAsync(() => getJob(params.id));

  const label = () => (job() ? JOB_TYPE_LABELS[job()!.type] : "Job");
  const etaBand = () => (job() ? JOB_ETA_BANDS[job()!.type] : null);
  const progress = () => (job() ? getStageProgress(job()!.stage) : 0);
  const isActive = () => (job() ? isActiveStage(job()!.stage) : false);
  const isFailed = () => job()?.stage === "failed";
  const isCompleted = () => job()?.stage === "completed";

  return (
    <>
      <Title>{formatPageTitle(label())}</Title>
      <Meta name="description" content={`View job details for ${label()}`} />

      <Container maxW="4xl" py="8" px="4">
        <VStack gap="6" alignItems="stretch">
          <HStack justify="space-between">
            <h1 class={css({ fontSize: "2xl", fontWeight: "bold" })}>
              {label()}
            </h1>
            <A
              href="/jobs"
              class={css({
                fontSize: "sm",
                color: "blue.600",
                _hover: { textDecoration: "underline" },
              })}
            >
              Back to jobs
            </A>
          </HStack>

          <Suspense
            fallback={
              <Box class={css({ p: "8", textAlign: "center" })}>
                <Spinner size="lg" />
              </Box>
            }
          >
            <Show
              when={job()}
              fallback={
                <Box
                  class={css({
                    p: "8",
                    textAlign: "center",
                    color: "gray.500",
                    bg: "gray.50",
                    rounded: "lg",
                  })}
                >
                  Job not found
                </Box>
              }
            >
              {(j) => (
                <VStack gap="4" alignItems="stretch">
                  <Box
                    class={css({
                      p: "6",
                      rounded: "lg",
                      border: "1px solid",
                      borderColor: isFailed()
                        ? "red.200"
                        : isCompleted()
                          ? "green.200"
                          : "blue.200",
                      bg: isFailed()
                        ? "red.50"
                        : isCompleted()
                          ? "green.50"
                          : "blue.50",
                    })}
                  >
                    <VStack gap="4" alignItems="stretch">
                      <HStack justify="space-between">
                        <HStack gap="2">
                          <Show when={isActive()}>
                            <Spinner size="sm" />
                          </Show>
                          <span
                            class={css({
                              fontWeight: "semibold",
                              fontSize: "lg",
                            })}
                          >
                            {label()}
                          </span>
                        </HStack>
                        <Box
                          class={css({
                            px: "3",
                            py: "1",
                            rounded: "full",
                            fontSize: "sm",
                            fontWeight: "medium",
                          })}
                          style={{
                            "background-color": isFailed()
                              ? "var(--colors-red-100)"
                              : isCompleted()
                                ? "var(--colors-green-100)"
                                : "var(--colors-blue-100)",
                            color: isFailed()
                              ? "var(--colors-red-700)"
                              : isCompleted()
                                ? "var(--colors-green-700)"
                                : "var(--colors-blue-700)",
                          }}
                        >
                          {j().stage}
                        </Box>
                      </HStack>

                      <Show when={isActive()}>
                        <JobStageIndicator currentStage={j().stage} />

                        <Progress.Root value={progress()} size="md">
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>

                        <Show when={etaBand()}>
                          <p class={css({ fontSize: "sm", color: "gray.600" })}>
                            {etaBand()!.label}
                          </p>
                        </Show>
                      </Show>

                      <Show when={isFailed()}>
                        <Box
                          class={css({
                            p: "3",
                            rounded: "md",
                            bg: "red.100",
                            color: "red.700",
                          })}
                        >
                          <p class={css({ fontWeight: "medium", mb: "1" })}>
                            Error
                          </p>
                          <p class={css({ fontSize: "sm" })}>
                            {j().error ?? "An unknown error occurred"}
                          </p>
                        </Box>
                      </Show>

                      <Show when={isCompleted() && j().resultSessionId}>
                        <A
                          href={`/session/${j().resultSessionId}`}
                          class={css({
                            display: "inline-block",
                            px: "4",
                            py: "2",
                            bg: "green.600",
                            color: "white",
                            rounded: "md",
                            fontWeight: "medium",
                            textAlign: "center",
                            _hover: { bg: "green.700" },
                          })}
                        >
                          View session
                        </A>
                      </Show>
                    </VStack>
                  </Box>

                  <Box
                    class={css({
                      p: "4",
                      rounded: "md",
                      bg: "gray.50",
                      border: "1px solid",
                      borderColor: "gray.200",
                    })}
                  >
                    <h3
                      class={css({
                        fontWeight: "medium",
                        mb: "3",
                        color: "gray.700",
                      })}
                    >
                      Details
                    </h3>
                    <VStack gap="2" alignItems="stretch">
                      <HStack justify="space-between">
                        <span
                          class={css({ color: "gray.500", fontSize: "sm" })}
                        >
                          Job ID
                        </span>
                        <span
                          class={css({ fontSize: "sm", fontFamily: "mono" })}
                        >
                          {j().id}
                        </span>
                      </HStack>
                      <HStack justify="space-between">
                        <span
                          class={css({ color: "gray.500", fontSize: "sm" })}
                        >
                          Created
                        </span>
                        <span class={css({ fontSize: "sm" })}>
                          {new Date(j().createdAt).toLocaleString()}
                        </span>
                      </HStack>
                      <Show when={j().completedAt}>
                        <HStack justify="space-between">
                          <span
                            class={css({ color: "gray.500", fontSize: "sm" })}
                          >
                            Completed
                          </span>
                          <span class={css({ fontSize: "sm" })}>
                            {new Date(j().completedAt!).toLocaleString()}
                          </span>
                        </HStack>
                      </Show>
                      <Show when={j().sessionId}>
                        <HStack justify="space-between">
                          <span
                            class={css({ color: "gray.500", fontSize: "sm" })}
                          >
                            Session ID
                          </span>
                          <A
                            href={`/session/${j().sessionId}`}
                            class={css({
                              fontSize: "sm",
                              fontFamily: "mono",
                              color: "blue.600",
                              _hover: { textDecoration: "underline" },
                            })}
                          >
                            {j().sessionId}
                          </A>
                        </HStack>
                      </Show>
                      <Show when={j().retryCount > 0}>
                        <HStack justify="space-between">
                          <span
                            class={css({ color: "gray.500", fontSize: "sm" })}
                          >
                            Retry count
                          </span>
                          <span class={css({ fontSize: "sm" })}>
                            {j().retryCount}
                          </span>
                        </HStack>
                      </Show>
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Show>
          </Suspense>
        </VStack>
      </Container>
    </>
  );
}
