import { createAsync } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { Stack, Box } from "styled-system/jsx";

import { Text } from "~/components/ui/text";
import { listSessions } from "~/server/actions";

type SessionListProps = {
  onSelectSession: (sessionId: string) => void;
};

export function SessionList(props: SessionListProps) {
  const sessions = createAsync(() => listSessions());

  const handleSessionClick = (sessionId: string) => {
    console.log("SessionList:handleSessionClick", sessionId);
    props.onSelectSession(sessionId);
  };

  return (
    <Suspense fallback={<Text>Loading sessions...</Text>}>
      <Stack gap="4">
        <Text fontSize="2xl" fontWeight="bold">
          Recent Sessions
        </Text>
        <Show
          when={sessions() && sessions()!.length > 0}
          fallback={<Text color="gray.500">No sessions yet.</Text>}
        >
          <Stack gap="3">
            <For each={sessions()}>
              {(session) => {
                const displayDate = () =>
                  new Date(session.updatedAt).toLocaleDateString();
                const displayTime = () =>
                  new Date(session.updatedAt).toLocaleTimeString();
                const roundCount = () => session.rounds?.length ?? 0;

                return (
                  <Box
                    p="4"
                    borderWidth="1px"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <Stack gap="2">
                      <Text fontWeight="semibold" fontSize="lg">
                        {session.prompt}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {roundCount()} {roundCount() === 1 ? "round" : "rounds"}{" "}
                        • {displayDate()} at {displayTime()}
                      </Text>
                    </Stack>
                  </Box>
                );
              }}
            </For>
          </Stack>
        </Show>
      </Stack>
    </Suspense>
  );
}
