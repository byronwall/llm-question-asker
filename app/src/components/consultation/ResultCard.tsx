import { Show } from "solid-js";
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
    <>
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
    </>
  );
}
