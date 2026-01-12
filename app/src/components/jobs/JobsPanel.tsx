import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { css } from "styled-system/css";
import { VStack, Box } from "styled-system/jsx";

import { useJobs } from "./job-context";
import { JobCard } from "./JobCard";

export function JobsPanel() {
  const jobsCtx = useJobs();

  const jobs = () => jobsCtx.jobs();
  const hasJobs = () => jobs().length > 0;

  return (
    <VStack gap="3" alignItems="stretch" minW="300px" maxW="400px">
      <Show
        when={hasJobs()}
        fallback={
          <Box class={css({ p: "4", textAlign: "center", color: "gray.500" })}>
            No active jobs
          </Box>
        }
      >
        <For each={jobs()}>
          {(job) => <JobCard job={job} onCancel={jobsCtx.cancelJob} />}
        </For>
      </Show>

      <Box
        class={css({
          pt: "1",
        })}
      >
        <A
          href="/jobs"
          class={css({
            fontSize: "sm",
            color: "blue.600",
            _hover: { textDecoration: "underline" },
          })}
          onClick={() => jobsCtx.setJobsPanelOpen(false)}
        >
          View all jobs
        </A>
      </Box>
    </VStack>
  );
}
