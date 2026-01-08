import { Show } from "solid-js";
import { Box } from "styled-system/jsx";
import { css } from "styled-system/css";
import { Heading } from "~/components/ui/heading";
import { Button } from "~/components/ui/button";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { useConsultation } from "./consultation-context";

type ResultCardProps = {
  result: string;
  isLastRound: boolean;
};

export function ResultCard(props: ResultCardProps) {
  const ctx = useConsultation();

  return (
    <Box
      p="6"
      bg="bg.subtle"
      borderRadius="md"
      border="1px solid"
      borderColor="border.default"
    >
      <Heading as="h3" class={css({ fontSize: "lg", mb: "4" })}>
        Analysis & Recommendations
      </Heading>

      <MarkdownRenderer>{props.result}</MarkdownRenderer>

      <Show when={props.isLastRound}>
        <Button
          mt="6"
          onClick={ctx.handleCreateNextRound}
          loading={ctx.isSubmitting()}
        >
          Refine with Another Round
        </Button>
      </Show>
    </Box>
  );
}
