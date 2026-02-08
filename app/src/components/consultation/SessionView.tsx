import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  onCleanup,
  onMount,
  createEffect,
  createSignal,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Stack } from "styled-system/jsx";
import { css } from "styled-system/css";

import * as Tabs from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { PageMeta } from "~/components/PageMeta";
import { SITE_URL, SITE_NAME } from "~/lib/site-meta";
import type { Session } from "~/lib/domain";
import {
  exportSessionAsMarkdown,
  downloadMarkdown,
  sanitizeFilename,
} from "~/lib/markdown-export";
import { downloadJson } from "~/lib/json-export";

import { useConsultation } from "./consultation-context";
import { useJobs } from "~/components/jobs/job-context";
import { SessionHeader } from "./SessionHeader";
import { RoundContent } from "./RoundContent";
import { QuestionsSkeleton } from "./QuestionsSkeleton";

export function SessionView() {
  const ctx = useConsultation();
  const navigate = useNavigate();
  const jobsCtx = useJobs();
  const [activeTab, setActiveTab] = createSignal("");
  const [latestSessionData, setLatestSessionData] = createSignal<Session | null>(
    null,
  );
  let tabsRootRef: HTMLDivElement | undefined;
  let lastRoundCount = 0;
  let lastRoundsKey = "";

  createEffect(() => {
    const nextValue = ctx.sessionData();
    if (nextValue) {
      setLatestSessionData(nextValue);
    }
  });

  const session = () => ctx.sessionData() ?? latestSessionData();

  const sessionSummary = () => {
    const current = session();
    if (!current) {
      return {
        hasSession: false,
        sessionId: null,
        roundCount: 0,
      };
    }

    return {
      hasSession: true,
      sessionId: current.id,
      roundCount: current.rounds.length,
      hasTitle: !!current.title,
      promptLength: current.prompt.length,
    };
  };

  console.log("SessionView:render", sessionSummary());

  const handleBackClick = () => {
    console.log("SessionView:handleBackClick");
    navigate("/");
  };

  const handleExportSession = () => {
    console.log("SessionView:handleExportSession");
    const session = ctx.sessionData();
    if (!session) return;

    const markdown = exportSessionAsMarkdown(session);
    const sessionTitle = session.title || `Session ${session.id.slice(0, 8)}`;
    const filename = sanitizeFilename(`${SITE_NAME} - ${sessionTitle}.md`);

    downloadMarkdown(markdown, filename);
  };

  const handleCopySession = async () => {
    console.log("SessionView:handleCopySession");
    const session = ctx.sessionData();
    if (!session) return "";

    return exportSessionAsMarkdown(session);
  };

  const handleDownloadJson = () => {
    console.log("SessionView:handleDownloadJson");
    const session = ctx.sessionData();
    if (!session) return;

    const sessionTitle = session.title || `Session ${session.id.slice(0, 8)}`;
    const filename = sanitizeFilename(`${SITE_NAME} - ${sessionTitle}.json`);
    const payload = JSON.stringify(session, null, 2);
    downloadJson(payload, filename);
  };

  const getTabValueFromLocation = (roundCount: number) => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const fromQuery = Number(params.get("round") ?? "");
    if (
      Number.isInteger(fromQuery) &&
      fromQuery >= 1 &&
      fromQuery <= roundCount
    ) {
      return `round-${fromQuery - 1}`;
    }

    const match = /^#round-(\d+)$/.exec(window.location.hash);
    const oneBasedRound = Number(match?.[1] ?? "");
    if (!Number.isInteger(oneBasedRound)) return null;
    if (oneBasedRound < 1 || oneBasedRound > roundCount) return null;
    return `round-${oneBasedRound - 1}`;
  };

  const updateRoundInUrl = (tabValue: string) => {
    if (typeof window === "undefined") return;
    const match = /^round-(\d+)$/.exec(tabValue);
    const zeroBasedRound = Number(match?.[1] ?? "");
    if (!Number.isInteger(zeroBasedRound)) return;
    const nextRound = String(zeroBasedRound + 1);
    const url = new URL(window.location.href);
    if (url.searchParams.get("round") === nextRound) return;
    url.searchParams.set("round", nextRound);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  const scrollToHashTargetWithRetry = () => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash === "#" || hash.startsWith("#round-")) return;

    const targetId = decodeURIComponent(hash.slice(1));
    if (!targetId) return;

    let attempts = 0;
    const maxAttempts = 8;

    const tryScroll = () => {
      attempts += 1;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, 80);
      }
    };

    window.setTimeout(tryScroll, 0);
  };

  createEffect(() => {
    const current = session();
    if (!current) return;
    const roundCount = current.rounds.length;
    if (roundCount === 0) return;

    const roundsKey = `${current.id}:${current.rounds
      .map((round) => round.id)
      .join("|")}`;
    if (roundsKey === lastRoundsKey) return;

    const nextValue =
      (lastRoundsKey ? null : getTabValueFromLocation(roundCount)) ??
      `round-${roundCount - 1}`;
    console.log("SessionView:roundsChanged", {
      sessionId: current.id,
      roundCount,
      nextValue,
      previousRoundsKey: lastRoundsKey,
      roundsKey,
    });
    setActiveTab(nextValue);
    updateRoundInUrl(nextValue);
    if (lastRoundsKey && roundCount > lastRoundCount) {
      tabsRootRef?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    lastRoundCount = roundCount;
    lastRoundsKey = roundsKey;
  });

  createEffect(() => {
    const current = session();
    if (!current) return;
    const tab = activeTab();
    if (!tab) return;
    scrollToHashTargetWithRetry();
  });

  onMount(() => {
    if (typeof window === "undefined") return;
    const handleHashChange = () => {
      scrollToHashTargetWithRetry();
    };
    window.addEventListener("hashchange", handleHashChange);
    onCleanup(() => {
      window.removeEventListener("hashchange", handleHashChange);
    });
  });

  const handleTabChange: NonNullable<Tabs.RootProps["onValueChange"]> = (
    details
  ) => {
    console.log("SessionView:handleTabChange", {
      value: details.value,
      previousValue: activeTab(),
    });
    setActiveTab(details.value);
    updateRoundInUrl(details.value);
  };

  return (
    <Suspense
      fallback={(() => {
        console.log("SessionView:Suspense:fallback");
        return (
          <Stack gap="4">
            <QuestionsSkeleton withCard={false} count={2} />
          </Stack>
        );
      })()}
    >
      <Show
        when={session()}
        fallback={(() => {
          console.log("SessionView:Show:fallback - no session data");
          return <Text>Session not found.</Text>;
        })()}
      >
        {(session) => {
          console.log("SessionView:Show:when - session loaded", {
            sessionId: session().id,
            roundCount: session().rounds.length,
            hasTitle: !!session().title,
            hasDescription: !!session().description,
            promptLength: session().prompt.length,
          });

          const pageTitle = () =>
            session().title || session().prompt.slice(0, 60);
          const pageDescription = () =>
            session().description ||
            session().prompt ||
            "Making better decisions through guided questions";
          const pageUrl = () => `${SITE_URL}/session/${session().id}`;
          const tabValue = () =>
            activeTab() || `round-${session().rounds.length - 1}`;
          const hasRounds = () => session().rounds.length > 0;
          const hasMultipleRounds = () => session().rounds.length > 1;
          const hasResults = () =>
            session().rounds.some((round) => !!round.result);
          const activeJob = () =>
            jobsCtx.jobs().find((job) => job.sessionId === session().id);
          const isCreatingSession = () =>
            activeJob()?.type === "create_session";
          const hasPromptDetails = () =>
            !!session().title && !!session().description;
          const showPromptTriggerInHeader = () =>
            hasPromptDetails() && !hasRounds();
          const showPromptTriggerInRounds = () =>
            hasPromptDetails() && hasRounds();
          const singleRound = () => session().rounds[0];

          return (
            <Stack gap="8">
              <PageMeta
                title={pageTitle()}
                description={pageDescription()}
                url={pageUrl()}
                type="article"
              />

              <SessionHeader
                sessionId={session().id}
                prompt={session().prompt}
                title={session().title}
                description={session().description}
                collapsePromptByDefault={hasResults()}
                showPromptTrigger={showPromptTriggerInHeader()}
                onBackClick={handleBackClick}
                onExport={handleExportSession}
                onDownloadJson={handleDownloadJson}
                onCopy={handleCopySession}
              />

              <Show
                when={hasRounds()}
                fallback={
                  <Switch>
                    <Match when={isCreatingSession()}>
                      <QuestionsSkeleton description="Generating your first set of questions..." />
                    </Match>
                    <Match when={!isCreatingSession()}>
                      <Text color="gray.500">No rounds yet.</Text>
                    </Match>
                  </Switch>
                }
              >
                <Switch>
                  <Match when={!hasMultipleRounds()}>
                    <RoundContent
                      round={singleRound()}
                      isLastRound={true}
                      prompt={session().prompt}
                      showPromptTrigger={showPromptTriggerInRounds()}
                    />
                  </Match>
                  <Match when={hasMultipleRounds()}>
                    <Tabs.Root
                      value={tabValue()}
                      onValueChange={handleTabChange}
                      ref={tabsRootRef}
                    >
                      <Tabs.List>
                        <For each={session().rounds}>
                          {(_round, index) => (
                            <Tabs.Trigger value={`round-${index()}`}>
                              Round {index() + 1}
                            </Tabs.Trigger>
                          )}
                        </For>
                        <Tabs.Indicator />
                      </Tabs.List>

                      <For each={session().rounds}>
                        {(round, index) => (
                          <Tabs.Content
                            value={`round-${index()}`}
                            class={css({ overflow: "visible !important" })}
                          >
                            <RoundContent
                              round={round}
                              isLastRound={
                                index() === session().rounds.length - 1
                              }
                              prompt={session().prompt}
                              showPromptTrigger={showPromptTriggerInRounds()}
                            />
                          </Tabs.Content>
                        )}
                      </For>
                    </Tabs.Root>
                  </Match>
                </Switch>
              </Show>
            </Stack>
          );
        }}
      </Show>
    </Suspense>
  );
}
