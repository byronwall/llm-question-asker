import {
  createContext,
  splitProps,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import type { Round } from "~/lib/domain";

type RoundContentContextValue = {
  round: Accessor<Round>;
  isLastRound: Accessor<boolean>;
};

type RoundContentProviderProps = ParentProps<{
  round: Round;
  isLastRound: boolean;
}>;

const RoundContentContext = createContext<RoundContentContextValue>();

export function RoundContentProvider(props: RoundContentProviderProps) {
  const [local] = splitProps(props, ["round", "isLastRound", "children"]);
  const value: RoundContentContextValue = {
    round: () => local.round,
    isLastRound: () => local.isLastRound,
  };

  return (
    <RoundContentContext.Provider value={value}>
      {local.children}
    </RoundContentContext.Provider>
  );
}

export function useRoundContent() {
  const ctx = useContext(RoundContentContext);
  if (!ctx) throw new Error("useRoundContent must be used within RoundContentProvider");
  return ctx;
}
