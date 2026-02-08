import { Show, splitProps } from "solid-js";
import { Box } from "styled-system/jsx";
import { css } from "styled-system/css";
import { XIcon } from "lucide-solid";

import * as Dialog from "~/components/ui/dialog";
import { Button, type ButtonProps } from "~/components/ui/button";
import { MarkdownRenderer } from "../MarkdownRenderer";

type PromptDialogProps = {
  prompt: string;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
};

export function PromptDialog(props: PromptDialogProps) {
  const [local] = splitProps(props, [
    "prompt",
    "triggerLabel",
    "triggerVariant",
    "triggerSize",
  ]);

  const promptValue = () => local.prompt;
  const hasPrompt = () => promptValue().trim().length > 0;
  const triggerLabel = () => local.triggerLabel ?? "View original prompt";
  const triggerVariant = () => local.triggerVariant ?? "outline";
  const triggerSize = () => local.triggerSize ?? "sm";

  return (
    <Show when={hasPrompt()}>
      <Dialog.Root>
        <Dialog.Trigger
          asChild={(triggerProps) => (
            <Button
              {...triggerProps}
              variant={triggerVariant()}
              size={triggerSize()}
            >
              {triggerLabel()}
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
              <Dialog.Title>Original Prompt</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger aria-label="Close prompt">
              <XIcon />
            </Dialog.CloseTrigger>
            <Dialog.Body class={css({ w: "full" })}>
              <Box
                class={css({
                  p: "3",
                  rounded: "md",
                  bg: "gray.50",
                  borderWidth: "1px",
                  borderColor: "gray.200",
                })}
              >
                <MarkdownRenderer>{promptValue()}</MarkdownRenderer>
              </Box>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Show>
  );
}
