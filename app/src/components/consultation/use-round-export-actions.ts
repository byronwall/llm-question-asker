import { createSignal, type Accessor } from "solid-js";
import { downloadMarkdown } from "~/lib/markdown-export";
import { buildRoundExportPayload } from "~/lib/round-export";
import { useConsultation } from "./consultation-context";
import { useRoundContent } from "./round-content-context";

type RoundExportActions = {
  copyButtonText: Accessor<string>;
  handleCopyRound: () => Promise<void>;
  handleExportRound: () => void;
};

export function useRoundExportActions(): RoundExportActions {
  const ctx = useConsultation();
  const content = useRoundContent();
  const [copyButtonText, setCopyButtonText] = createSignal("Copy as Markdown");

  const resetCopyButton = (value: string) => {
    setCopyButtonText(value);
    setTimeout(() => setCopyButtonText("Copy as Markdown"), 2000);
  };

  const handleExportRound = () => {
    console.log("useRoundExportActions:handleExportRound");
    const session = ctx.sessionData();
    if (!session) return;

    const payload = buildRoundExportPayload(content.round(), session);
    downloadMarkdown(payload.markdown, payload.filename);
  };

  const handleCopyRound = async () => {
    console.log("useRoundExportActions:handleCopyRound");
    const session = ctx.sessionData();
    if (!session) return;

    const payload = buildRoundExportPayload(content.round(), session);

    try {
      await navigator.clipboard.writeText(payload.markdown);
      resetCopyButton("Copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
      resetCopyButton("Failed to copy");
    }
  };

  return {
    copyButtonText,
    handleCopyRound,
    handleExportRound,
  };
}
