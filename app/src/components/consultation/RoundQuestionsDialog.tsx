import { HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { XIcon } from "lucide-solid";
import * as Dialog from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useRoundQuestionsState } from "./use-round-questions";
import { RoundQuestionsActionsMenu } from "./RoundQuestionsActionsMenu";
import { RoundQuestionsReviewBody } from "./RoundQuestionsReviewBody";

export function RoundQuestionsDialog() {
  const { questionCount, questionsHeaderMeta } = useRoundQuestionsState();

  return (
    <Dialog.Root>
      <Dialog.Trigger
        asChild={(triggerProps) => (
          <Button {...triggerProps} variant="outline" size="sm">
            View questions ({questionCount()})
          </Button>
        )}
      />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          class={css({
            maxW: "4xl",
            "--dialog-base-margin": "24px",
            maxH: "80vh",
            overflowY: "auto",
          })}
        >
          <Dialog.Header>
            <HStack justifyContent="space-between" alignItems="center">
              <Stack gap="1">
                <Dialog.Title>Questions</Dialog.Title>
                <Dialog.Description>{questionsHeaderMeta()}</Dialog.Description>
              </Stack>
              <RoundQuestionsActionsMenu />
            </HStack>
          </Dialog.Header>
          <Dialog.CloseTrigger aria-label="Close questions">
            <XIcon />
          </Dialog.CloseTrigger>
          <Dialog.Body class={css({ w: "full" })}>
            <RoundQuestionsReviewBody />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
