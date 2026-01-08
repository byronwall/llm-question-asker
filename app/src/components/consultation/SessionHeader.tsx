import { Box, HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import { createSignal, Show } from "solid-js";
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

  const handleBackClick = () => {
    console.log("SessionHeader:handleBackClick");
    props.onBackClick();
  };

  const handleToggleExpand = () => {
    console.log("SessionHeader:handleToggleExpand", !isExpanded());
    setIsExpanded(!isExpanded());
  };

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
          >
            <Stack gap="2">
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                Original Prompt
              </Text>

              <Box
                class={css({
                  lineClamp: isExpanded() ? "unset" : 7,
                  overflow: "hidden",
                })}
              >
                <MarkdownRenderer>{props.prompt}</MarkdownRenderer>
              </Box>

              <Button
                variant="plain"
                size="sm"
                onClick={handleToggleExpand}
                class={css({ alignSelf: "flex-start" })}
              >
                {isExpanded() ? "Show less" : "Show more"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <Show when={isExpanded()}>
        <Box
          class={css({
            position: "sticky",
            bottom: "1rem",
            display: "flex",
            justifyContent: "flex-start",
            marginLeft: "-10rem",
            zIndex: 10,
          })}
        >
          <Button
            variant="solid"
            onClick={handleToggleExpand}
            class={css({
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            })}
          >
            Collapse Prompt
          </Button>
        </Box>
      </Show>
    </>
  );
}
