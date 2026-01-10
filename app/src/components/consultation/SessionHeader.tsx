import { Box, HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { createSignal, Show, onMount, createEffect } from "solid-js";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { MarkdownRenderer } from "../MarkdownRenderer";

type SessionHeaderProps = {
  prompt: string;
  title?: string;
  description?: string;
  onBackClick: () => void;
};

export function SessionHeader(props: SessionHeaderProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isClamped, setIsClamped] = createSignal(false);
  let contentRef: HTMLDivElement | undefined;

  const handleBackClick = () => {
    console.log("SessionHeader:handleBackClick");
    props.onBackClick();
  };

  const handleToggleExpand = () => {
    console.log("SessionHeader:handleToggleExpand", !isExpanded());
    setIsExpanded(!isExpanded());
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
        <HStack gap="4" alignItems="center">
          <Button variant="outline" onClick={handleBackClick}>
            ← Back to Sessions
          </Button>
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
