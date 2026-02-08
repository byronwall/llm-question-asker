import { useNavigate, useParams } from "@solidjs/router";
import { Container } from "styled-system/jsx";

import { ConsultationProvider } from "~/components/consultation/consultation-context";
import { SessionView } from "~/components/consultation/SessionView";

export default function SessionRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const sessionId = () => params.id;

  const handleSetSessionId = (id: string) => {
    navigate(`/session/${id}`);
  };

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
