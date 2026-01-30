import { Show, splitProps } from "solid-js";
import { HStack } from "styled-system/jsx";
import { PromptDialog } from "./PromptDialog";
import { RoundQuestionsDialog } from "./RoundQuestionsDialog";
import { useRoundQuestionsState } from "./use-round-questions";

type RoundSupportingActionsProps = {
  prompt: string;
  showPromptTrigger: boolean;
};

export function RoundSupportingActions(props: RoundSupportingActionsProps) {
  const [local] = splitProps(props, ["prompt", "showPromptTrigger"]);
  const { hasResult } = useRoundQuestionsState();

  const showSupportingActions = () =>
    local.showPromptTrigger || hasResult();

  return (
    <Show when={showSupportingActions()}>
      <HStack gap="2" flexWrap="wrap">
        <Show when={local.showPromptTrigger}>
          <PromptDialog prompt={local.prompt} />
        </Show>
        <Show when={hasResult()}>
          <RoundQuestionsDialog />
        </Show>
      </HStack>
    </Show>
  );
}
