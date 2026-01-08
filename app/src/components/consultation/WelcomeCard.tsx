import { css } from "styled-system/css";
import { Stack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { SITE_DESCRIPTION, SITE_NAME } from "~/lib/site-meta";
import { useConsultation } from "./consultation-context";

export function WelcomeCard() {
  const ctx = useConsultation();

  return (
    <Stack gap="6">
      <Stack gap="2">
        <Heading as="h1" class={css({ fontSize: "3xl", fontWeight: "bold" })}>
          {SITE_NAME}
        </Heading>
        <Text class={css({ fontSize: "lg", color: "fg.muted" })}>
          {SITE_DESCRIPTION}
        </Text>
      </Stack>

      <Stack gap="4">
        <VStack gap="2" alignItems="stretch">
          <Text fontWeight="bold" fontSize="xl">
            What are you looking to achieve?
          </Text>
          <Textarea
            placeholder="e.g., I want to build a mobile app for sustainable grocery shopping..."
            rows={4}
            value={ctx.prompt()}
            onInput={(e) => ctx.setPrompt(e.currentTarget.value)}
          />
        </VStack>

        <Button
          class={css({ py: 5, fontSize: "lg", alignSelf: "flex-start" })}
          loading={ctx.isSubmitting()}
          onClick={ctx.handleCreateSession}
        >
          Start Consultation
        </Button>
      </Stack>
    </Stack>
  );
}
