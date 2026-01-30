import type { Round, Session } from "~/lib/domain";
import { exportRoundAsMarkdown, sanitizeFilename } from "~/lib/markdown-export";
import { SITE_NAME } from "~/lib/site-meta";

type RoundExportPayload = {
  markdown: string;
  filename: string;
  roundNumber: number | undefined;
  sessionTitle: string;
};

export function getRoundNumber(
  session: Session,
  roundId: string,
): number | undefined {
  const roundIndex = session.rounds.findIndex((round) => round.id === roundId);
  return roundIndex >= 0 ? roundIndex + 1 : undefined;
}

export function getSessionTitle(session: Session): string {
  return session.title || `Session ${session.id.slice(0, 8)}`;
}

export function buildRoundExportPayload(
  round: Round,
  session: Session,
): RoundExportPayload {
  const roundNumber = getRoundNumber(session, round.id);
  const sessionTitle = getSessionTitle(session);
  const markdown = exportRoundAsMarkdown(round, roundNumber);
  const filename = sanitizeFilename(
    `${SITE_NAME} - ${sessionTitle} - Round ${roundNumber ?? "export"}.md`,
  );

  return {
    markdown,
    filename,
    roundNumber,
    sessionTitle,
  };
}
