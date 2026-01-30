import { Show } from "solid-js";
import { HStack } from "styled-system/jsx";
import * as Card from "~/components/ui/card";
import { ResultCard } from "./ResultCard";
import { useRoundContent } from "./round-content-context";
import { RoundResultActionsMenu } from "./RoundResultActionsMenu";

export function RoundResultSection() {
  const content = useRoundContent();

  return (
    <Show when={content.round().result}>
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Card.Title>Analysis & Recommendations</Card.Title>
            <RoundResultActionsMenu />
          </HStack>
        </Card.Header>
        <Card.Body>
          <ResultCard
            result={content.round().result!}
            isLastRound={content.isLastRound()}
          />
        </Card.Body>
      </Card.Root>
    </Show>
  );
}
