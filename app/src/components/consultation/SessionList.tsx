import { createAsync } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { Stack, Box, HStack } from "styled-system/jsx";

import { Text } from "~/components/ui/text";
import { Badge } from "~/components/ui/badge";
import { useJobs } from "~/components/jobs/job-context";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { listSessions } from "~/server/actions";

type SessionListProps = {
  onSelectSession: (sessionId: string) => void;
};

export function SessionList(props: SessionListProps) {
  const sessions = createAsync(() => listSessions());
  const jobsCtx = useJobs();

  const handleSessionClick = (sessionId: string) => {
    console.log("SessionList:handleSessionClick", sessionId);
    props.onSelectSession(sessionId);
  };

  return (
    <Suspense
      fallback={
        <Stack gap="3">
          <Stack gap="2">
            <Box
              p="4"
              borderWidth="1px"
              borderRadius="lg"
              borderColor="gray.200"
            />
            <Box
              p="4"
              borderWidth="1px"
              borderRadius="lg"
              borderColor="gray.200"
            />
          </Stack>
        </Stack>
      }
    >
      <Stack gap="4">
        <Text fontSize="xl" fontWeight="bold">
          Recent Sessions
        </Text>
        <Show
          when={sessions() && sessions()!.length > 0}
          fallback={<Text color="gray.500">No sessions yet.</Text>}
        >
          <Stack gap="2">
            <For each={sessions()}>
              {(session) => {
                const displayDate = () =>
                  new Date(session.updatedAt).toLocaleDateString();
                const displayTime = () =>
                  new Date(session.updatedAt).toLocaleTimeString();
                const roundCount = () => session.rounds?.length ?? 0;
                const displayTitle = () =>
                  session.title || session.prompt.slice(0, 50);
                const displayDescription = () =>
                  session.description || session.prompt.slice(0, 100);
                const latestRound = () =>
                  session.rounds.length > 0
                    ? session.rounds[session.rounds.length - 1]
                    : null;
                const questionCount = () =>
                  latestRound()?.questions.length ?? 0;
                const answeredCount = () => latestRound()?.answers.length ?? 0;
                const hasResult = () => !!latestRound()?.result;
                const hasQuestionsWaiting = () =>
                  questionCount() > answeredCount() && !hasResult();
                const activeJob = () =>
                  jobsCtx.jobs().find((job) => job.sessionId === session.id);
                const statusLabel = () => {
                  if (activeJob()) return JOB_TYPE_LABELS[activeJob()!.type];
                  if (hasResult()) return "Recommendations ready";
                  if (hasQuestionsWaiting()) return "Questions waiting";
                  if (questionCount() > 0) return "Questions ready";
                  return "No rounds yet";
                };

                return (
                  <Box
                    p="4"
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor="gray.200"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "gray.50", borderColor: "gray.300" }}
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <Stack gap="1.5">
                      <Text fontWeight="semibold" fontSize="md">
                        {displayTitle()}
                      </Text>
                      <Text fontSize="sm" color="gray.600" lineClamp={2}>
                        {displayDescription()}
                      </Text>
                      <HStack gap="2" flexWrap="wrap">
                        <Text fontSize="xs" color="gray.500">
                          {roundCount()}{" "}
                          {roundCount() === 1 ? "round" : "rounds"} •{" "}
                          {displayDate()} at {displayTime()}
                        </Text>
                        <Badge size="sm" variant="subtle">
                          {statusLabel()}
                        </Badge>
                        <Show when={hasResult()}>
                          <Badge size="sm" variant="solid">
                            Output ready
                          </Badge>
                        </Show>
                        <Show when={hasQuestionsWaiting()}>
                          <Badge size="sm" variant="outline">
                            {answeredCount()}/{questionCount()} answered
                          </Badge>
                        </Show>
                        <Show when={activeJob()}>
                          <Badge size="sm" variant="outline">
                            Running
                          </Badge>
                        </Show>
                      </HStack>
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
