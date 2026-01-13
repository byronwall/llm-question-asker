import { Show } from "solid-js";
import { BriefcaseIcon } from "lucide-solid";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { useJobs } from "./job-context";
import { Badge } from "~/components/ui/badge";
import * as Popover from "~/components/ui/popover";
import { JobsPanel } from "./JobsPanel";

export function JobsIndicator() {
  const jobsCtx = useJobs();

  const count = () => jobsCtx.activeJobCount();
  const handleOpenChange = (details: { open: boolean }) => {
    console.log("JobsIndicator:openChange", { open: details.open });
    jobsCtx.setJobsPanelOpen(details.open);
  };

  return (
    <Popover.Root
      open={jobsCtx.isJobsPanelOpen()}
      onOpenChange={handleOpenChange}
    >
      <Popover.Trigger
        class={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          w: "10",
          h: "10",
          rounded: "full",
          bg: "white",
          border: "1px solid",
          borderColor: "gray.200",
          boxShadow: "sm",
          cursor: "pointer",
          transition: "all 0.2s",
          _hover: { bg: "gray.50" },
        })}
      >
        <BriefcaseIcon size={18} />
        <Show when={count() > 0}>
          <Badge
            size="sm"
            variant="solid"
            class={css({
              position: "absolute",
              top: "-1",
              right: "-1",
              minW: "5",
              h: "5",
              px: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            {count()}
          </Badge>
        </Show>
      </Popover.Trigger>

      <Popover.Positioner>
        <Popover.Content>
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Box class={css({ p: "3" })}>
            <JobsPanel />
          </Box>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
