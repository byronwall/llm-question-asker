import { Show } from "solid-js";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { JobsIndicator } from "./JobsIndicator";
import { useJobs } from "./job-context";

export function JobsHeader() {
  const jobsCtx = useJobs();
  const hasActive = () => jobsCtx.hasActiveJobs();

  return (
    <Show when={hasActive()}>
      <Box
        class={css({
          position: "fixed",
          top: "4",
          right: "4",
          zIndex: "overlay",
        })}
      >
        <JobsIndicator />
      </Box>
    </Show>
  );
}
