import { useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { Container, Stack } from "styled-system/jsx";

import { SITE_DESCRIPTION, SITE_URL } from "~/lib/site-meta";

import { PageMeta } from "~/components/PageMeta";
import { ConsultationProvider } from "~/components/consultation/consultation-context";
import { WelcomeCard } from "~/components/consultation/WelcomeCard";
import { SessionList } from "~/components/consultation/SessionList";

export default function HomeRoute() {
  console.log(
    "HomeRoute component running! Client:",
    typeof window !== "undefined",
  );

  createEffect(() => {
    console.log("🎉 HomeRoute component hydrated and running!");
  });

  const navigate = useNavigate();

  const handleSelectSession = (id: string) => {
    console.log("HomeRoute:handleSelectSession", id);
    navigate(`/session/${id}`);
  };

  return (
    <Container py="6" maxW="4xl">
      <PageMeta description={SITE_DESCRIPTION} url={SITE_URL} />

      <ConsultationProvider
        sessionId={undefined}
        setSessionId={handleSelectSession}
      >
        <Stack gap="8">
          <WelcomeCard />
          <SessionList onSelectSession={handleSelectSession} />
        </Stack>
      </ConsultationProvider>
    </Container>
  );
}
