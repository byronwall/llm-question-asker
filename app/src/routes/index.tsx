import { Meta, Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import { Container, Stack } from "styled-system/jsx";

import { SITE_NAME } from "~/lib/site-meta";

import { ConsultationProvider } from "~/components/consultation/consultation-context";
import { WelcomeCard } from "~/components/consultation/WelcomeCard";
import { SessionList } from "~/components/consultation/SessionList";

export default function HomeRoute() {
  console.log(
    "HomeRoute component running! Client:",
    typeof window !== "undefined"
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
    <Container py="4" maxW="4xl">
      <Title>{SITE_NAME}</Title>
      <Meta name="description" content={SITE_NAME} />

      <ConsultationProvider
        sessionId={undefined}
        setSessionId={handleSelectSession}
      >
        <Stack gap="6">
          <WelcomeCard />
          <SessionList onSelectSession={handleSelectSession} />
        </Stack>
      </ConsultationProvider>
    </Container>
  );
}
