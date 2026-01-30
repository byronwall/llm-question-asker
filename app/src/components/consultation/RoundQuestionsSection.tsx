import { Show, createEffect, createSignal } from "solid-js";
import { Box, HStack, Stack } from "styled-system/jsx";
import { css } from "styled-system/css";
import * as Card from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import * as Collapsible from "~/components/ui/collapsible";
import { RoundQuestionsActionsMenu } from "./RoundQuestionsActionsMenu";
import { RoundQuestionsBody } from "./RoundQuestionsBody";
import { useRoundQuestionsState } from "./use-round-questions";

export function RoundQuestionsSection() {
  const { hasResult, canCollapseQuestions, questionsHeaderMeta } =
    useRoundQuestionsState();
  const [questionsExpanded, setQuestionsExpanded] = createSignal(false);

  createEffect(() => {
    if (!hasResult()) {
      if (!questionsExpanded()) {
        setQuestionsExpanded(true);
      }
      return;
    }
    if (questionsExpanded()) {
      console.log("RoundQuestionsSection:collapseQuestions");
      setQuestionsExpanded(false);
    }
  });

  const handleQuestionsOpenChange: NonNullable<
    Collapsible.RootProps["onOpenChange"]
  > = (details) => {
    if (!canCollapseQuestions()) return;
    console.log("RoundQuestionsSection:questionsOpenChange", {
      open: details.open,
    });
    setQuestionsExpanded(details.open);
  };

  const questionsOpen = () =>
    canCollapseQuestions() ? questionsExpanded() : true;

  return (
    <Show when={!hasResult()}>
      <Collapsible.Root
        open={questionsOpen()}
        onOpenChange={handleQuestionsOpenChange}
      >
        <Card.Root class={css({ overflow: "visible !important" })}>
          <Box
            class={css({
              position: hasResult() && questionsExpanded() ? "sticky" : "static",
              top: 0,
              bg: "white",
              zIndex: 10,
              px: 6,
              pt: 6,
              pb: hasResult() && questionsExpanded() ? 4 : 0,
              borderBottomWidth:
                hasResult() && questionsExpanded() ? "1px" : "0",
              borderBottomColor: "border.default",
            })}
          >
            <HStack justifyContent="space-between" alignItems="center" w="full">
              <Stack gap="1">
                <Card.Title>Questions</Card.Title>
                <Box
                  class={css({
                    fontSize: "xs",
                    color: "gray.500",
                  })}
                >
                  {questionsHeaderMeta()}
                </Box>
              </Stack>
              <HStack gap="2">
                <Show when={canCollapseQuestions()}>
                  <Collapsible.Trigger
                    asChild={(triggerProps) => (
                      <Button {...triggerProps} variant="outline" size="sm">
                        {questionsExpanded() ? "Hide Questions" : "Show Questions"}
                      </Button>
                    )}
                  />
                </Show>
                <RoundQuestionsActionsMenu />
              </HStack>
            </HStack>
          </Box>

          <Show
            when={canCollapseQuestions()}
            fallback={<Card.Body><RoundQuestionsBody /></Card.Body>}
          >
            <Collapsible.Content>
              <Card.Body>
                <RoundQuestionsBody />
              </Card.Body>
            </Collapsible.Content>
          </Show>
        </Card.Root>
      </Collapsible.Root>
    </Show>
  );
}
