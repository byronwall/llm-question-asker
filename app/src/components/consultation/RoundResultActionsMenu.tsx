import { Show, batch, createSignal } from "solid-js";
import { Box, HStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import {
  CopyIcon,
  DownloadIcon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-solid";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import { useConsultation } from "./consultation-context";
import { useRoundContent } from "./round-content-context";
import { useRoundExportActions } from "./use-round-export-actions";

export function RoundResultActionsMenu() {
  const ctx = useConsultation();
  const content = useRoundContent();
  const { handleExportRound } = useRoundExportActions();
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");

  const resetCopyButton = (value: string) => {
    setCopyButtonText(value);
    setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
  };

  const handleCopyMarkdown = async () => {
    console.log("RoundResultActionsMenu:handleCopyMarkdown");
    const result = content.round().result;
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      resetCopyButton("Copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
      resetCopyButton("Failed to copy");
    }
  };

  const handleOpenNewSessionDialog = () => {
    console.log("RoundResultActionsMenu:handleOpenNewSessionDialog");
    batch(() => {
      ctx.setFocusDialogState("closeIntent", false);
      ctx.setFocusDialogState("isOpen", true);
    });
  };

  const handleRefineRound = () => {
    console.log("RoundResultActionsMenu:handleRefineRound");
    void ctx.handleCreateNextRound();
  };

  return (
    <Menu.Root size="sm">
      <Menu.Trigger
        asChild={(triggerProps) => (
          <IconButton
            {...triggerProps}
            size="xs"
            variant="plain"
            aria-label="Result actions"
          >
            <MoreVerticalIcon />
          </IconButton>
        )}
      />
      <Menu.Positioner>
        <Menu.Content class={css({ minW: "220px" })}>
          <Menu.Item value="copy-markdown" onSelect={() => void handleCopyMarkdown()}>
            <HStack gap="2" alignItems="center">
              <CopyIcon />
              <Box>{copyButtonText()}</Box>
            </HStack>
          </Menu.Item>
          <Menu.Item value="export-round" onSelect={handleExportRound}>
            <HStack gap="2" alignItems="center">
              <DownloadIcon />
              <Box>Export as Markdown</Box>
            </HStack>
          </Menu.Item>
          <Show when={content.isLastRound()}>
            <Menu.Separator />
            <Menu.Item
              value="refine-round"
              onSelect={handleRefineRound}
              disabled={ctx.isSubmitting()}
            >
              <HStack gap="2" alignItems="center">
                <RefreshCwIcon />
                <Box>Refine with Another Round</Box>
              </HStack>
            </Menu.Item>
            <Menu.Item
              value="create-session"
              onSelect={handleOpenNewSessionDialog}
              disabled={ctx.isSubmitting()}
            >
              <HStack gap="2" alignItems="center">
                <PlusIcon />
                <Box>Create new session</Box>
              </HStack>
            </Menu.Item>
          </Show>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
