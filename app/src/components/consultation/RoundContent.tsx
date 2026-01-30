import { splitProps } from "solid-js";
import { css } from "styled-system/css";
import type { Round } from "~/lib/domain";
import { RoundContentProvider } from "./round-content-context";
import { RoundGeneratingResultSection } from "./RoundGeneratingResultSection";
import { RoundQuestionsSection } from "./RoundQuestionsSection";
import { RoundResultSection } from "./RoundResultSection";
import { RoundSupportingActions } from "./RoundSupportingActions";

type RoundContentProps = {
  round: Round;
  isLastRound: boolean;
  prompt: string;
  showPromptTrigger: boolean;
};

export function RoundContent(props: RoundContentProps) {
  const [local] = splitProps(props, [
    "round",
    "isLastRound",
    "prompt",
    "showPromptTrigger",
  ]);

  return (
    <RoundContentProvider
      round={local.round}
      isLastRound={local.isLastRound}
    >
      <div
        class={css({
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflow: "visible",
        })}
      >
        <RoundSupportingActions
          prompt={local.prompt}
          showPromptTrigger={local.showPromptTrigger}
        />
        <RoundResultSection />
        <RoundQuestionsSection />
        <RoundGeneratingResultSection />
      </div>
    </RoundContentProvider>
  );
}
