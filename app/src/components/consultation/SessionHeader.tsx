import { Box, HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { createSignal, Show, onMount, createEffect } from "solid-js";
import { CopyIcon, DownloadIcon, MoreVerticalIcon } from "lucide-solid";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { IconButton } from "~/components/ui/icon-button";
import * as Menu from "~/components/ui/menu";
import { MarkdownRenderer } from "../MarkdownRenderer";

type SessionHeaderProps = {
  prompt: string;
  title?: string;
  description?: string;
  onBackClick: () => void;
  onExport?: () => void;
  onCopy?: () => Promise<string>;
};

export function SessionHeader(props: SessionHeaderProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isClamped, setIsClamped] = createSignal(false);
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");
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

  return (
    <>
      <Stack gap="4">
        <HStack gap="4" alignItems="center" justifyContent="space-between">
          <Button variant="outline" onClick={handleBackClick}>
            ← Back to Sessions
          </Button>
          <Show when={props.onExport}>
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
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </Show>
        </HStack>

        <Stack gap="3">
          <Show when={props.title}>
            <Heading as="h1" class={css({ fontSize: "2xl" })}>
              {props.title}
            </Heading>
          </Show>

          <Show when={props.description}>
            <Text fontSize="lg" color="gray.700">
              {props.description}
            </Text>
          </Show>

          <Box
            p="4"
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
                      Show less
                    </Button>
                  </Show>
                </HStack>
              </Box>

              <Box
                ref={contentRef}
                class={css({
                  lineClamp: isExpanded() ? "unset" : 7,
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
                  {isExpanded() ? "Show less" : "Show more"}
                </Button>
              </Show>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </>
  );
}
