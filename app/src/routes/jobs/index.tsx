import { For, Show, Suspense } from "solid-js";
import { A } from "@solidjs/router";
import { createAsync } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";
import { css } from "styled-system/css";
import { VStack, HStack, Box, Container } from "styled-system/jsx";

import { getAllJobs } from "~/server/job-actions";
import { JobCard } from "~/components/jobs/JobCard";
import { useJobs } from "~/components/jobs/job-context";
import { isActiveStage, JOB_TYPE_LABELS } from "~/lib/job-types";

export default function JobsPage() {
  const jobsCtx = useJobs();
  const allJobs = createAsync(() => getAllJobs());

  const activeJobs = () =>
    (allJobs() ?? []).filter((j) => isActiveStage(j.stage));
  const completedJobs = () =>
    (allJobs() ?? []).filter((j) => j.stage === "completed");
  const failedJobs = () =>
    (allJobs() ?? []).filter((j) => j.stage === "failed");

  return (
    <>
      <Title>Jobs | Prod Ideator</Title>
      <Meta name="description" content="View all your AI processing jobs" />

      <Container maxW="4xl" py="8" px="4">
        <VStack gap="6" alignItems="stretch">
          <HStack justify="space-between">
            <h1 class={css({ fontSize: "2xl", fontWeight: "bold" })}>Jobs</h1>
            <A
              href="/"
              class={css({
                fontSize: "sm",
                color: "blue.600",
                _hover: { textDecoration: "underline" },
              })}
            >
              Back to home
            </A>
          </HStack>

          <Suspense
            fallback={
              <Box
                class={css({ p: "4", textAlign: "center", color: "gray.500" })}
              >
                Loading jobs...
              </Box>
            }
          >
            <Show when={activeJobs().length > 0}>
              <VStack gap="3" alignItems="stretch">
                <h2
                  class={css({
                    fontSize: "lg",
                    fontWeight: "semibold",
                    color: "gray.700",
                  })}
                >
                  Active ({activeJobs().length})
                </h2>
                <For each={activeJobs()}>
                  {(job) => <JobCard job={job} onCancel={jobsCtx.cancelJob} />}
                </For>
              </VStack>
            </Show>

            <Show when={failedJobs().length > 0}>
              <VStack gap="3" alignItems="stretch">
                <h2
                  class={css({
                    fontSize: "lg",
                    fontWeight: "semibold",
                    color: "red.600",
                  })}
                >
                  Failed ({failedJobs().length})
                </h2>
                <For each={failedJobs()}>{(job) => <JobCard job={job} />}</For>
              </VStack>
            </Show>

            <Show when={completedJobs().length > 0}>
              <VStack gap="3" alignItems="stretch">
                <h2
                  class={css({
                    fontSize: "lg",
                    fontWeight: "semibold",
                    color: "green.600",
                  })}
                >
                  Completed ({completedJobs().length})
                </h2>
                <For each={completedJobs()}>
                  {(job) => (
                    <Box
                      class={css({
                        p: "3",
                        rounded: "md",
                        border: "1px solid",
                        borderColor: "gray.200",
                        bg: "gray.50",
                      })}
                    >
                      <HStack justify="space-between">
                        <VStack gap="1" alignItems="start">
                          <span
                            class={css({
                              fontWeight: "medium",
                              fontSize: "sm",
                            })}
                          >
                            {JOB_TYPE_LABELS[job.type]}
                          </span>
                          <span
                            class={css({ fontSize: "xs", color: "gray.500" })}
                          >
                            Completed{" "}
                            {job.completedAt
                              ? new Date(job.completedAt).toLocaleString()
                              : ""}
                          </span>
                        </VStack>
                        <Show when={job.resultSessionId}>
                          <A
                            href={`/session/${job.resultSessionId}`}
                            class={css({
                              fontSize: "sm",
                              color: "blue.600",
                              _hover: { textDecoration: "underline" },
                            })}
                          >
                            View session
                          </A>
                        </Show>
                      </HStack>
                    </Box>
                  )}
                </For>
              </VStack>
            </Show>

            <Show
              when={
                activeJobs().length === 0 &&
                completedJobs().length === 0 &&
                failedJobs().length === 0
              }
            >
              <Box
                class={css({
                  p: "8",
                  textAlign: "center",
                  color: "gray.500",
                  bg: "gray.50",
                  rounded: "lg",
                })}
              >
                <p class={css({ fontSize: "lg", mb: "2" })}>No jobs yet</p>
                <p class={css({ fontSize: "sm" })}>
                  Jobs will appear here when you start creating sessions or
                  generating results.
                </p>
              </Box>
            </Show>
          </Suspense>
        </VStack>
      </Container>
    </>
  );
}
