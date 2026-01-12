import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  createEffect,
  createSignal,
} from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Stack } from "styled-system/jsx";
import { css } from "styled-system/css";

import * as Tabs from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { PageMeta } from "~/components/PageMeta";
import { SITE_URL } from "~/lib/site-meta";

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
  let tabsRootRef: HTMLDivElement | undefined;
  let lastRoundCount = 0;
  let lastRoundsKey = "";

  const sessionSummary = () => {
    const session = ctx.sessionData();
    if (!session) {
      return {
        hasSession: false,
        sessionId: null,
        roundCount: 0,
      };
    }

    return {
      hasSession: true,
      sessionId: session.id,
      roundCount: session.rounds.length,
      hasTitle: !!session.title,
      promptLength: session.prompt.length,
    };
  };

  console.log("SessionView:render", sessionSummary());

  const handleBackClick = () => {
    console.log("SessionView:handleBackClick");
    navigate("/");
  };

  createEffect(() => {
    const session = ctx.sessionData();
    if (!session) return;
    const roundCount = session.rounds.length;
    if (roundCount === 0) return;

    const roundsKey = `${session.id}:${session.rounds
      .map((round) => round.id)
      .join("|")}`;
    if (roundsKey === lastRoundsKey) return;

    const nextValue = `round-${roundCount - 1}`;
    console.log("SessionView:roundsChanged", {
      sessionId: session.id,
      roundCount,
      nextValue,
      previousRoundsKey: lastRoundsKey,
      roundsKey,
    });
    setActiveTab(nextValue);
    if (lastRoundsKey && roundCount > lastRoundCount) {
      tabsRootRef?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    lastRoundCount = roundCount;
    lastRoundsKey = roundsKey;
  });

  const handleTabChange: NonNullable<Tabs.RootProps["onValueChange"]> = (
    details
  ) => {
    console.log("SessionView:handleTabChange", {
      value: details.value,
      previousValue: activeTab(),
    });
    setActiveTab(details.value);
  };

  return (
    <Suspense
      fallback={(() => {
        console.log("SessionView:Suspense:fallback");
        return <Text>Loading session...</Text>;
      })()}
    >
      <Show
        when={ctx.sessionData()}
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
          const activeJob = () =>
            jobsCtx.jobs().find((job) => job.sessionId === session().id);
          const isCreatingSession = () =>
            activeJob()?.type === "create_session";

          return (
            <Stack gap="8">
              <PageMeta
                title={pageTitle()}
                description={pageDescription()}
                url={pageUrl()}
                type="article"
              />

              <SessionHeader
                prompt={session().prompt}
                title={session().title}
                description={session().description}
                onBackClick={handleBackClick}
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
                          isLastRound={index() === session().rounds.length - 1}
                        />
                      </Tabs.Content>
                    )}
                  </For>
                </Tabs.Root>
              </Show>
            </Stack>
          );
        }}
      </Show>
    </Suspense>
  );
}
