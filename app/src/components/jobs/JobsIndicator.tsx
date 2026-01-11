import { Show } from "solid-js";
import { BriefcaseIcon } from "lucide-solid";
import { css } from "styled-system/css";
import { HStack, Box } from "styled-system/jsx";

import { useJobs } from "./job-context";
import { Spinner } from "~/components/ui/spinner";
import { Badge } from "~/components/ui/badge";
import * as Popover from "~/components/ui/popover";
import { JobsPanel } from "./JobsPanel";

export function JobsIndicator() {
  const jobsCtx = useJobs();

  const count = () => jobsCtx.activeJobCount();
  const hasActive = () => jobsCtx.hasActiveJobs();
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
          gap: "2",
          px: "3",
          py: "2",
          rounded: "md",
          cursor: "pointer",
          transition: "all 0.2s",
          _hover: { bg: "gray.100" },
        })}
      >
        <HStack gap="2">
          <Show when={hasActive()} fallback={<BriefcaseIcon size={18} />}>
            <Spinner size="sm" />
          </Show>
          <span class={css({ fontSize: "sm", fontWeight: "medium" })}>
            Jobs
          </span>
          <Show when={count() > 0}>
            <Badge size="sm" variant="solid">
              {count()}
            </Badge>
          </Show>
        </HStack>
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
