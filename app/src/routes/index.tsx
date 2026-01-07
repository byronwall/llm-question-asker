import { createAsync, useAction, useSearchParams } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { createEffect, createSignal, For, Show, Suspense } from "solid-js";
import { css } from "styled-system/css";
import { Box, Container, HStack, Stack, VStack } from "styled-system/jsx";
import { createStore } from "solid-js/store";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import * as Checkbox from "~/components/ui/checkbox";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import * as Card from "~/components/ui/card";

import { createSession, getSession, submitAnswers } from "~/server/actions";
import { formatPageTitle, SITE_DESCRIPTION } from "~/lib/site-meta";
import type { Answer, Session } from "~/lib/domain";

export default function HomeRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = () => searchParams.sessionId as string | undefined;

  const runCreateSession = useAction(createSession);
  const runSubmitAnswers = useAction(submitAnswers);
  const sessionData = createAsync(
    () => {
      const id = sessionId();
      if (!id) return Promise.resolve(null);
      return getSession(id);
    },
    {
      deferStream: true,
    }
  );

  const [prompt, setPrompt] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Local store for answers: map questionId -> Answer
  const [answersStore, setAnswersStore] = createStore<Record<string, Answer>>(
    {}
  );

  createEffect(() => {
    console.log("answersStore:", answersStore);
  });

  // Initialize answers store when questions are loaded
  createEffect(() => {
    const s = sessionData();
    if (s?.questions) {
      for (const q of s.questions) {
        if (!answersStore[q.id]) {
          setAnswersStore(q.id, {
            questionId: q.id,
            selectedOptionIds: [],
            customInput: "",
          });
        }
      }
    }
  });

  createEffect(() => {
    const s = sessionData();
    if (s && !s.result && s.questions.length === 0) {
      const t = setTimeout(() => window.location.reload(), 3000);
      return () => clearTimeout(t);
    }
  });

  const handleCreateSession = async (e: Event) => {
    e.preventDefault();
    if (!prompt().trim()) return;
    setIsSubmitting(true);
    try {
      const session = await runCreateSession(prompt());
      setSearchParams({ sessionId: session.id });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswers = async () => {
    const s = sessionData();
    if (!s) return;

    setIsSubmitting(true);
    try {
      const answersList = Object.values(answersStore);
      await runSubmitAnswers({ sessionId: s.id, answers: answersList });
      // Force re-fetch or rely on action return if we refetch session
      window.location.reload(); // Simple reload to get updated session with result
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOption = (
    questionId: string,
    optionId: string,
    checked: boolean
  ) => {
    console.log(
      `Toggling option ${optionId} for question ${questionId}. New checked state: ${checked}`
    );
    setAnswersStore(questionId, "selectedOptionIds", (prev) => {
      let next;
      if (checked) {
        next = [...prev, optionId];
      } else {
        next = prev.filter((id) => id !== optionId);
      }
      console.log("New selectedOptionIds:", next);
      return next;
    });
  };

  return (
    <Container py="10" maxW="4xl">
      <Title>{formatPageTitle("Consultant")}</Title>
      <Meta name="description" content={SITE_DESCRIPTION} />

      <Suspense fallback={<Box>Loading session...</Box>}>
        <Show
          when={sessionId()}
          fallback={
            // STEP 1: PROMPT INPUT
            <VStack gap="6" alignItems="stretch">
              <Heading class={css({ fontSize: "3xl", fontWeight: "bold" })}>
                What can I help you with today?
              </Heading>
              <Text color="fg.muted" class={css({ fontSize: "lg" })}>
                Describe your goal or problem in detail. I'll ask a few
                questions to understand better.
              </Text>
              <form onSubmit={handleCreateSession}>
                <VStack gap="4" alignItems="stretch">
                  <Textarea
                    value={prompt()}
                    onInput={(e) => setPrompt(e.currentTarget.value)}
                    placeholder="e.g. I want to build a deck in my backyard, but I don't know where to start..."
                    rows={6}
                    class={css({ fontSize: "lg", p: 4 })}
                  />
                  <Button
                    type="submit"
                    class={css({ py: 6, fontSize: "xl" })}
                    loading={isSubmitting()}
                  >
                    Start Consultation
                  </Button>
                </VStack>
              </form>
            </VStack>
          }
        >
          {(_id) => (
            <Show when={sessionData()}>
              {(session) => (
                <VStack gap="8" alignItems="stretch">
                  <Show when={session().result}>
                    {/* STEP 3: RESULT */}
                    <Box>
                      <Heading
                        class={css({ fontSize: "2xl", fontWeight: "bold" })}
                        mb="4"
                      >
                        Recommendation
                      </Heading>
                      <Box
                        class={css({
                          whiteSpace: "pre-wrap",
                          lineHeight: "relaxed",
                          bg: "bg.subtle",
                          p: "6",
                          borderRadius: "lg",
                        })}
                      >
                        {session().result}
                      </Box>
                      <Button
                        mt="8"
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                      >
                        Start Over
                      </Button>
                    </Box>
                  </Show>

                  <Show
                    when={!session().result && session().questions.length > 0}
                  >
                    {/* STEP 2: QUESTIONS */}
                    <Heading
                      class={css({ fontSize: "2xl", fontWeight: "bold" })}
                    >
                      A few follow-up questions...
                    </Heading>
                    <For each={session().questions}>
                      {(question) => (
                        <Card.Root>
                          <Card.Header>
                            <Card.Title>{question.text}</Card.Title>
                          </Card.Header>
                          <Card.Body>
                            <Stack gap="3">
                              <For each={question.options}>
                                {(option) => (
                                  <Checkbox.Root
                                    checked={answersStore[
                                      question.id
                                    ]?.selectedOptionIds.includes(option.id)}
                                    onCheckedChange={(details) =>
                                      toggleOption(
                                        question.id,
                                        option.id,
                                        !!details.checked
                                      )
                                    }
                                  >
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Label>
                                      {option.text}
                                    </Checkbox.Label>
                                  </Checkbox.Root>
                                )}
                              </For>
                              <Box mt="2">
                                <Text
                                  class={css({
                                    fontSize: "sm",
                                    color: "fg.muted",
                                    mb: 1,
                                  })}
                                >
                                  Other / Specific Details:
                                </Text>
                                <Input
                                  value={
                                    answersStore[question.id]?.customInput || ""
                                  }
                                  onInput={(e) =>
                                    setAnswersStore(
                                      question.id,
                                      "customInput",
                                      e.currentTarget.value
                                    )
                                  }
                                  placeholder="Type your answer here..."
                                />
                              </Box>
                            </Stack>
                          </Card.Body>
                        </Card.Root>
                      )}
                    </For>
                    <Button
                      class={css({ py: 6, fontSize: "xl" })}
                      onClick={handleSubmitAnswers}
                      loading={isSubmitting()}
                    >
                      Submit Answers & Get Result
                    </Button>
                  </Show>

                  <Show
                    when={!session().result && session().questions.length === 0}
                  >
                    <VStack py="20" gap="4">
                      <Heading>Analyzing your request...</Heading>
                      <Text color="fg.muted">
                        Generating follow-up questions. This might take a
                        moment.
                      </Text>
                      <div />
                    </VStack>
                  </Show>
                </VStack>
              )}
            </Show>
          )}
        </Show>
      </Suspense>
    </Container>
  );
}
