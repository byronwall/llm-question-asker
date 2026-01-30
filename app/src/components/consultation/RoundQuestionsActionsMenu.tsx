import { Box, HStack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { CopyIcon, DownloadIcon, MoreVerticalIcon } from "lucide-solid";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import { useRoundExportActions } from "./use-round-export-actions";

type RoundQuestionsActionsMenuProps = {
  ariaLabel?: string;
};

export function RoundQuestionsActionsMenu(props: RoundQuestionsActionsMenuProps) {
  const { copyButtonText, handleCopyRound, handleExportRound } =
    useRoundExportActions();

  const ariaLabel = () => props.ariaLabel ?? "Questions actions";

  return (
    <Menu.Root size="sm">
      <Menu.Trigger
        asChild={(triggerProps) => (
          <IconButton
            {...triggerProps}
            size="xs"
            variant="plain"
            aria-label={ariaLabel()}
          >
            <MoreVerticalIcon />
          </IconButton>
        )}
      />
      <Menu.Positioner>
        <Menu.Content class={css({ minW: "220px" })}>
          <Menu.Item value="copy-round" onSelect={() => void handleCopyRound()}>
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
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}
