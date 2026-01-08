import { Meta, Title } from "@solidjs/meta";
import { useSearchParams } from "@solidjs/router";
import { createEffect, For, Show, Suspense } from "solid-js";
import { Container, Stack } from "styled-system/jsx";

import * as Tabs from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";

import { SITE_NAME } from "~/lib/site-meta";

import {
  ConsultationProvider,
  useConsultation,
} from "~/components/consultation/consultation-context";
import { WelcomeCard } from "~/components/consultation/WelcomeCard";
import { SessionHeader } from "~/components/consultation/SessionHeader";
import { RoundContent } from "~/components/consultation/RoundContent";
import { SessionList } from "~/components/consultation/SessionList";

function SessionView() {
  const ctx = useConsultation();

  return (
    <Suspense fallback={<Text>Loading session...</Text>}>
      <Show
        when={ctx.sessionData()}
        fallback={<Text>Session not found.</Text>}
      >
        {(session) => (
          <Stack gap="8">
            <SessionHeader prompt={session().prompt} />

            <Tabs.Root defaultValue={`round-${session().rounds.length - 1}`}>
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
        )}
      </Show>
    </Suspense>
  );
}

export default function HomeRoute() {
  console.log(
    "HomeRoute component running! Client:",
    typeof window !== "undefined"
  );

  createEffect(() => {
    console.log("🎉 HomeRoute component hydrated and running!");
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const setSessionId = (id: string) => {
    setSearchParams({ sessionId: id });
  };

  return (
    <Container py="10" maxW="4xl">
      <Title>{SITE_NAME}</Title>
      <Meta name="description" content={SITE_NAME} />

      <ConsultationProvider
        sessionId={searchParams.sessionId as string | undefined}
        setSessionId={setSessionId}
      >
        <Stack gap="10">
          <Show
            when={searchParams.sessionId}
            fallback={
              <Stack gap="8">
                <WelcomeCard />
                <SessionList onSelectSession={setSessionId} />
              </Stack>
            }
          >
            <SessionView />
          </Show>
        </Stack>
      </ConsultationProvider>
    </Container>
  );
}
