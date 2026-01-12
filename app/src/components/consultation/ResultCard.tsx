import { Show } from "solid-js";
import { HStack } from "styled-system/jsx";
import { PlusIcon, RefreshCwIcon } from "lucide-solid";
import { Button } from "~/components/ui/button";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { useConsultation } from "./consultation-context";
import { NewSessionFromFocusDialog } from "./NewSessionFromFocusDialog";

type ResultCardProps = {
  result: string;
  isLastRound: boolean;
};

export function ResultCard(props: ResultCardProps) {
  const ctx = useConsultation();

  return (
    <>
      <MarkdownRenderer>{props.result}</MarkdownRenderer>

      <Show when={props.isLastRound}>
        <HStack mt="6" gap="3" flexWrap="wrap">
          <Button
            onClick={ctx.handleCreateNextRound}
            loading={ctx.isSubmitting()}
          >
            <HStack gap="2" alignItems="center">
              <RefreshCwIcon />
              <span>Refine with Another Round</span>
            </HStack>
          </Button>
          <NewSessionFromFocusDialog />
        </HStack>
      </Show>
    </>
  );
}
