import { For, Show, Suspense } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Stack } from "styled-system/jsx";

import * as Tabs from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";

import { useConsultation } from "./consultation-context";
import { SessionHeader } from "./SessionHeader";
import { RoundContent } from "./RoundContent";

export function SessionView() {
  const ctx = useConsultation();
  const navigate = useNavigate();

  console.log("SessionView:render", {
    sessionData: ctx.sessionData(),
    hasSession: !!ctx.sessionData(),
  });

  const handleBackClick = () => {
    console.log("SessionView:handleBackClick");
    navigate("/");
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
          console.log("SessionView:Show:when - session loaded", session());
          return (
            <Stack gap="8">
              <SessionHeader
                prompt={session().prompt}
                title={session().title}
                description={session().description}
                onBackClick={handleBackClick}
              />

              <Tabs.Root
                defaultValue={`round-${session().rounds.length - 1}`}
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
                    <Tabs.Content value={`round-${index()}`}>
                      <RoundContent
                        round={round}
                        isLastRound={index() === session().rounds.length - 1}
                      />
                    </Tabs.Content>
                  )}
                </For>
              </Tabs.Root>
            </Stack>
          );
        }}
      </Show>
    </Suspense>
  );
}
