import { For, Show } from "solid-js";
import { CheckIcon } from "lucide-solid";
import { css } from "styled-system/css";
import { HStack, Box } from "styled-system/jsx";

import type { JobStage } from "~/lib/job-types";
import { STAGE_LABELS } from "~/lib/job-types";

type Props = {
  currentStage: JobStage;
};

const DISPLAY_STAGES: JobStage[] = [
  "extract",
  "analyze",
  "generate",
  "finalize",
];

const stageIndex = (stage: JobStage) => DISPLAY_STAGES.indexOf(stage);

export function JobStageIndicator(props: Props) {
  const currentIdx = () => stageIndex(props.currentStage);
  const isCompleted = () => props.currentStage === "completed";
  const isFailed = () => props.currentStage === "failed";

  return (
    <HStack gap="1" flexWrap="wrap">
      <For each={DISPLAY_STAGES}>
        {(stage, idx) => {
          const isPast = () => isCompleted() || currentIdx() > idx();
          const isCurrent = () =>
            !isCompleted() && !isFailed() && currentIdx() === idx();

          return (
            <HStack gap="1">
              <Box
                class={css({
                  px: "2",
                  py: "0.5",
                  rounded: "full",
                  fontSize: "xs",
                  fontWeight: "medium",
                  transition: "all 0.2s",
                })}
                style={{
                  "background-color": isPast()
                    ? "var(--colors-green-100)"
                    : isCurrent()
                      ? "var(--colors-blue-100)"
                      : "var(--colors-gray-100)",
                  color: isPast()
                    ? "var(--colors-green-700)"
                    : isCurrent()
                      ? "var(--colors-blue-700)"
                      : "var(--colors-gray-500)",
                }}
              >
                <HStack gap="1">
                  <Show when={isPast()}>
                    <CheckIcon size={12} />
                  </Show>
                  <span>{STAGE_LABELS[stage]}</span>
                </HStack>
              </Box>
              <Show when={idx() < DISPLAY_STAGES.length - 1}>
                <Box class={css({ color: "gray.300", fontSize: "xs" })}>→</Box>
              </Show>
            </HStack>
          );
        }}
      </For>
    </HStack>
  );
}
