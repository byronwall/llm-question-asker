import { Show } from "solid-js";
import { HStack, Stack } from "styled-system/jsx";
import { PlusIcon, RefreshCwIcon } from "lucide-solid";
import { Button } from "~/components/ui/button";
import * as Field from "~/components/ui/field";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { Textarea } from "~/components/ui/textarea";
import { useConsultation } from "./consultation-context";
import { NewSessionFromFocusDialog } from "./NewSessionFromFocusDialog";

type ResultCardProps = {
  result: string;
  isLastRound: boolean;
};

export function ResultCard(props: ResultCardProps) {
  const ctx = useConsultation();

  const handleRefineGuidanceInput = (event: InputEvent) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    ctx.setRefineGuidance(target.value);
  };

  return (
    <>
      <MarkdownRenderer>{props.result}</MarkdownRenderer>

      <Show when={props.isLastRound}>
        <Stack mt="6" gap="4">
          <Field.Root>
            <Field.Label fontWeight="bold">
              Additional guidance for the next round (optional)
            </Field.Label>
            <Textarea
              autoresize
              placeholder="Share any focus areas or constraints for the next round..."
              value={ctx.refineGuidance()}
              onInput={handleRefineGuidanceInput}
              disabled={ctx.isSubmitting()}
            />
          </Field.Root>
          <HStack gap="3" flexWrap="wrap">
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
        </Stack>
      </Show>
    </>
  );
}
