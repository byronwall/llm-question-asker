import { Meta, Title } from "@solidjs/meta";
import { createAsync, useAction, useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { css } from "styled-system/css";
import { Box, Container, HStack, Stack, VStack } from "styled-system/jsx";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";

import { Button } from "~/components/ui/button";
import * as Card from "~/components/ui/card";
import * as Checkbox from "~/components/ui/checkbox";
import { Heading } from "~/components/ui/heading";
import * as Tabs from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";

import type { Answer } from "~/lib/domain";
import { SITE_DESCRIPTION, SITE_NAME } from "~/lib/site-meta";
import {
  createNextRound,
  createSession,
  getSession,
  submitAnswers,
} from "~/server/actions";

export default function HomeRoute() {
  console.log(
    "HomeRoute component running! Client:",
    typeof window !== "undefined"
  );

  createEffect(() => {
    console.log("🎉 HomeRoute component hydrated and running!");
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [prompt, setPrompt] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [answers, setAnswers] = createStore<Answer[]>([]);

  const sessionData = createAsync(() =>
    searchParams.sessionId
      ? getSession(searchParams.sessionId as string)
      : Promise.resolve(null)
  );

  const runCreateSession = useAction(createSession);
  const runSubmitAnswers = useAction(submitAnswers);
  const runCreateNextRound = useAction(createNextRound);

  const handleCreateSession = async () => {
    console.log("🚀 handleCreateSession called (Button onClick)");
    const currentPrompt = prompt().trim();
    if (!currentPrompt) return;

    setIsSubmitting(true);
    try {
      const session = await runCreateSession(currentPrompt);
      setSearchParams({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRound = () => {
    const session = sessionData();
    if (!session || !session.rounds.length) return null;
    return session.rounds[session.rounds.length - 1];
  };

  const isRoundComplete = () => {
    const round = currentRound();
    if (!round) return false;
    return round.answers.length === round.questions.length;
  };

  const handleToggleOption = (questionId: string, optionId: string) => {
    const existing = answers.find((a) => a.questionId === questionId);
    if (!existing) {
      setAnswers([
        ...answers,
        { questionId, selectedOptionIds: [optionId], customInput: undefined },
      ]);
    } else {
      const isSelected = existing.selectedOptionIds.includes(optionId);
      const newOptions = isSelected
        ? existing.selectedOptionIds.filter((id) => id !== optionId)
        : [...existing.selectedOptionIds, optionId];

      setAnswers(
        (a) => a.questionId === questionId,
        "selectedOptionIds",
        newOptions
      );
    }
  };

  const handleSubmitRound = async () => {
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runSubmitAnswers({ sessionId: session.id, answers: [...answers] });
      setAnswers([]); // Reset for next round if any
    } catch (error) {
      console.error("Error submitting answers:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNextRound = async () => {
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runCreateNextRound(session.id);
    } catch (error) {
      console.error("Error creating next round:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container py="10" maxW="4xl">
      <Title>{SITE_NAME}</Title>
      <Meta name="description" content={SITE_DESCRIPTION} />

      <Stack gap="10">
        <Show
          when={searchParams.sessionId}
          fallback={
            <VStack gap="8" py="20" textAlign="center">
              <Stack gap="2">
                <Heading
                  as="h1"
                  class={css({ fontSize: "4xl", fontWeight: "black" })}
                >
                  {SITE_NAME}
                </Heading>
                <Text
                  class={css({
                    fontSize: "xl",
                    color: "fg.muted",
                    maxW: "2xl",
                  })}
                >
                  {SITE_DESCRIPTION}
                </Text>
              </Stack>

              <Box w="full" maxW="2xl" textAlign="left">
                <Card.Root>
                  <Card.Body>
                    <Stack gap="4">
                      <VStack gap="2" alignItems="stretch">
                        <Text fontWeight="semibold">
                          What are you looking to achieve?
                        </Text>
                        <Textarea
                          placeholder="e.g., I want to build a mobile app for sustainable grocery shopping..."
                          rows={4}
                          value={prompt()}
                          onInput={(e) => setPrompt(e.currentTarget.value)}
                        />
                      </VStack>

                      <Button
                        class={css({ py: 6, fontSize: "xl" })}
                        loading={isSubmitting()}
                        onClick={handleCreateSession}
                      >
                        Start Consultation
                      </Button>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </Box>
            </VStack>
          }
        >
          <Suspense fallback={<Text>Loading session...</Text>}>
            <Show
              when={sessionData()}
              fallback={<Text>Session not found.</Text>}
            >
              {(session) => (
                <Stack gap="8">
                  <Box>
                    <Heading as="h1" class={css({ fontSize: "2xl", mb: "2" })}>
                      Consultation Session
                    </Heading>
                    <Text color="fg.muted">
                      Original Request: "{session().prompt}"
                    </Text>
                  </Box>

                  <Tabs.Root
                    defaultValue={`round-${session().rounds.length - 1}`}
                  >
                    <Tabs.List>
                      <For each={session().rounds}>
                        {(round, index) => (
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
                          <Card.Root>
                            <Card.Body>
                              <Stack gap="8">
                                <For each={round.questions}>
                                  {(question) => {
                                    const answer = () => {
                                      if (round.answers && round.answers.length > 0) {
                                        return round.answers.find(
                                          (a) => a.questionId === question.id
                                        );
                                      }

                                      if (index() === session().rounds.length - 1) {
                                        return answers.find(
                                          (a) => a.questionId === question.id
                                        );
                                      }

                                      return undefined;
                                    };

                                    return (
                                      <Stack gap="4">
                                        <Text fontWeight="bold">
                                          {question.text}
                                        </Text>
                                        <Stack gap="2">
                                          <For each={question.options}>
                                            {(option) => (
                                              <HStack gap="3">
                                                <Checkbox.Root
                                                  checked={answer()?.selectedOptionIds.includes(
                                                    option.id
                                                  )}
                                                  onCheckedChange={() => {
                                                    if (
                                                      index() ===
                                                      session().rounds.length - 1
                                                    ) {
                                                      handleToggleOption(
                                                        question.id,
                                                        option.id
                                                      );
                                                    }
                                                  }}
                                                  disabled={
                                                    index() <
                                                    session().rounds.length - 1
                                                  }
                                                >
                                                  <Checkbox.Control />
                                                  <Checkbox.Label>
                                                    {option.text}
                                                  </Checkbox.Label>
                                                  <Checkbox.HiddenInput />
                                                </Checkbox.Root>
                                              </HStack>
                                            )}
                                          </For>
                                        </Stack>
                                      </Stack>
                                    );
                                  }}
                                </For>

                                <Show when={round.result}>
                                  <Box
                                    p="6"
                                    bg="bg.subtle"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="border.default"
                                  >
                                    <Heading
                                      as="h3"
                                      class={css({ fontSize: "lg", mb: "4" })}
                                    >
                                      Analysis & Recommendations
                                    </Heading>

                                    <MarkdownRenderer>
                                      {round.result}
                                    </MarkdownRenderer>

                                    <Show
                                      when={
                                        index() === session().rounds.length - 1
                                      }
                                    >
                                      <Button
                                        mt="6"
                                        onClick={handleCreateNextRound}
                                        loading={isSubmitting()}
                                      >
                                        Refine with Another Round
                                      </Button>
                                    </Show>
                                  </Box>
                                </Show>

                                <Show
                                  when={
                                    !round.result &&
                                    index() === session().rounds.length - 1
                                  }
                                >
                                  <Button
                                    size="lg"
                                    disabled={
                                      answers.length < round.questions.length
                                    }
                                    onClick={handleSubmitRound}
                                    loading={isSubmitting()}
                                  >
                                    Submit Answers
                                  </Button>
                                </Show>
                              </Stack>
                            </Card.Body>
                          </Card.Root>
                        </Tabs.Content>
                      )}
                    </For>
                  </Tabs.Root>
                </Stack>
              )}
            </Show>
          </Suspense>
        </Show>
      </Stack>
    </Container>
  );
}
