import { Box, HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { createSignal, Show, onMount, createEffect } from "solid-js";
import {
  CopyIcon,
  DownloadIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-solid";
import { useAction, useNavigate } from "@solidjs/router";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { deleteSession } from "~/server/actions";
import { PromptDialog } from "./PromptDialog";

type SessionHeaderProps = {
  sessionId: string;
  prompt: string;
  title?: string;
  description?: string;
  collapsePromptByDefault?: boolean;
  showPromptTrigger?: boolean;
  onBackClick: () => void;
  onExport?: () => void;
  onDownloadJson?: () => void;
  onCopy?: () => Promise<string>;
};

export function SessionHeader(props: SessionHeaderProps) {
  const navigate = useNavigate();
  const runDeleteSession = useAction(deleteSession);
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isClamped, setIsClamped] = createSignal(false);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = createSignal(false);
  const [autoCollapsed, setAutoCollapsed] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;

  const handleBackClick = () => {
    console.log("SessionHeader:handleBackClick");
    props.onBackClick();
  };

  const handleToggleExpand = () => {
    console.log("SessionHeader:handleToggleExpand", !isExpanded());
    setIsExpanded(!isExpanded());
  };

  const handleExport = () => {
    console.log("SessionHeader:handleExport");
    props.onExport?.();
  };

  const handleDownloadJson = () => {
    console.log("SessionHeader:handleDownloadJson");
    props.onDownloadJson?.();
  };

  const handleCopy = async () => {
    console.log("SessionHeader:handleCopy");
    if (!props.onCopy) return;

    try {
      const content = await props.onCopy();
      await navigator.clipboard.writeText(content);
      setCopyButtonText("Copied!");
      setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyButtonText("Failed to copy");
      setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
    }
  };

  const handleDelete = async () => {
    console.log("SessionHeader:handleDelete", props.sessionId);
    try {
      await runDeleteSession(props.sessionId);
      navigate("/");
    } catch (error) {
      console.error("SessionHeader:handleDelete:error", error);
    }
  };

  const checkIfClamped = () => {
    if (contentRef) {
      const clamped = contentRef.scrollHeight > contentRef.clientHeight;
      console.log("SessionHeader:checkIfClamped", clamped, {
        scrollHeight: contentRef.scrollHeight,
        clientHeight: contentRef.clientHeight,
      });
      setIsClamped(clamped);
    }
  };

  onMount(() => {
    checkIfClamped();
  });

  createEffect(() => {
    props.prompt;
    setTimeout(() => checkIfClamped(), 100);
  });

  createEffect(() => {
    if (!props.collapsePromptByDefault) {
      if (autoCollapsed()) setAutoCollapsed(false);
      return;
    }
    if (autoCollapsed()) return;
    if (isExpanded()) {
      console.log("SessionHeader:collapsePrompt");
      setIsExpanded(false);
    }
    setAutoCollapsed(true);
  });

  const promptClampLines = () => {
    if (isExpanded()) return "unset";
    if (props.collapsePromptByDefault) return 3;
    return 7;
  };

  const displayTitle = () => {
    if (props.title) return props.title;
    return props.prompt.slice(0, 64);
  };

  const displayDescription = () => {
    if (props.description) return props.description;
    return props.prompt.slice(0, 140);
  };

  const showPromptInline = () => !props.title || !props.description;
  const showPromptTrigger = () =>
    !showPromptInline() && props.showPromptTrigger;
  const hasMenuActions = () =>
    !!props.onCopy || !!props.onExport || !!props.onDownloadJson;

  return (
    <>
      <Stack gap="4">
        <HStack gap="4" alignItems="center" justifyContent="space-between">
          <Button variant="outline" onClick={handleBackClick}>
            ← Back to Sessions
          </Button>
          <Show when={hasMenuActions()}>
            <Menu.Root size="sm">
              <Menu.Trigger
                asChild={(triggerProps) => (
                  <IconButton
                    {...triggerProps}
                    size="sm"
                    variant="plain"
                    aria-label="Session actions"
                  >
                    <MoreVerticalIcon />
                  </IconButton>
                )}
              />
              <Menu.Positioner>
                <Menu.Content class={css({ minW: "220px" })}>
                  <Show when={props.onCopy}>
                    <Menu.Item
                      value="copy-markdown"
                      onSelect={() => void handleCopy()}
                    >
                      <HStack gap="2" alignItems="center">
                        <CopyIcon />
                        <Box>{copyButtonText()}</Box>
                      </HStack>
                    </Menu.Item>
                  </Show>
                  <Menu.Item value="export" onSelect={handleExport}>
                    <HStack gap="2" alignItems="center">
                      <DownloadIcon />
                      <Box>Export as Markdown</Box>
                    </HStack>
                  </Menu.Item>
                  <Show when={props.onDownloadJson}>
                    <Menu.Item
                      value="download-json"
                      onSelect={handleDownloadJson}
                    >
                      <HStack gap="2" alignItems="center">
                        <DownloadIcon />
                        <Box>Download raw JSON</Box>
                      </HStack>
                    </Menu.Item>
                  </Show>
                  <Menu.Separator />
                  <Menu.Item
                    value="delete"
                    onSelect={() => setIsDeleteDialogOpen(true)}
                  >
                    <HStack gap="2" alignItems="center">
                      <TrashIcon class={css({ color: "red.500" })} />
                      <Box class={css({ color: "red.500" })}>Delete Session</Box>
                    </HStack>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </Show>
        </HStack>

        <Stack gap="3">
          <Heading as="h1" class={css({ fontSize: "2xl" })}>
            {displayTitle()}
          </Heading>

          <Show when={displayDescription()}>
            <Text fontSize="lg" color="gray.700">
              {displayDescription()}
            </Text>
          </Show>

          <Show when={showPromptInline()}>
            <Box
              p="3"
              bg="gray.50"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              position="relative"
            >
              <Stack gap="2">
                <Box
                  class={css({
                    position: isExpanded() ? "sticky" : "static",
                    top: 0,
                    bg: "white",
                    zIndex: 10,
                    pb: 2,
                    mb: isExpanded() ? 2 : 0,
                    borderBottomWidth: isExpanded() ? "1px" : "0",
                    borderBottomColor: "gray.200",
                  })}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Original Prompt
                    </Text>
                    <Show when={isExpanded()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleExpand}
                      >
                        Collapse prompt
                      </Button>
                    </Show>
                  </HStack>
                </Box>

                <Box
                  ref={contentRef}
                  class={css({
                    lineClamp: promptClampLines(),
                    overflow: "hidden",
                  })}
                >
                  <MarkdownRenderer>{props.prompt}</MarkdownRenderer>
                </Box>

                <Show when={isClamped() || isExpanded()}>
                  <Button
                    variant="plain"
                    size="sm"
                    onClick={handleToggleExpand}
                    class={css({ alignSelf: "flex-start" })}
                  >
                    {isExpanded() ? "Show less" : "Show prompt"}
                  </Button>
                </Show>
              </Stack>
            </Box>
          </Show>
          <Show when={showPromptTrigger()}>
            <PromptDialog prompt={props.prompt} />
          </Show>
        </Stack>
      </Stack>

      <ConfirmDialog
        open={isDeleteDialogOpen()}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
      />
    </>
  );
}
