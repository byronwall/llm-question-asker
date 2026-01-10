import { useNavigate, useParams } from "@solidjs/router";
import { createEffect } from "solid-js";
import { Container } from "styled-system/jsx";

import { ConsultationProvider } from "~/components/consultation/consultation-context";
import { SessionView } from "~/components/consultation/SessionView";

export default function SessionRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const sessionId = () => params.id;

  console.log("SessionRoute:render", {
    isClient: typeof window !== "undefined",
    sessionId: sessionId(),
    params,
  });

  createEffect(() => {
    console.log("SessionRoute:createEffect - component hydrated", {
      sessionId: sessionId(),
    });
  });

  const handleSetSessionId = (id: string) => {
    console.log("SessionRoute:handleSetSessionId", id);
    navigate(`/session/${id}`);
  };

  console.log("SessionRoute:about to render", {
    sessionId: sessionId(),
    hasSessionId: !!sessionId(),
  });

  return (
    <Container py="4" maxW="4xl">
      <ConsultationProvider
        sessionId={sessionId()}
        setSessionId={handleSetSessionId}
      >
        <SessionView />
      </ConsultationProvider>
    </Container>
  );
}
