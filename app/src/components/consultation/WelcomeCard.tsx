import { css } from "styled-system/css";
import { Box, Stack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import * as Card from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { SITE_DESCRIPTION, SITE_NAME } from "~/lib/site-meta";
import { useConsultation } from "./consultation-context";

export function WelcomeCard() {
  const ctx = useConsultation();

  return (
    <VStack gap="8" py="20" textAlign="center">
      <Stack gap="2">
        <Heading as="h1" class={css({ fontSize: "4xl", fontWeight: "black" })}>
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
                  value={ctx.prompt()}
                  onInput={(e) => ctx.setPrompt(e.currentTarget.value)}
                />
              </VStack>

              <Button
                class={css({ py: 6, fontSize: "xl" })}
                loading={ctx.isSubmitting()}
                onClick={ctx.handleCreateSession}
              >
                Start Consultation
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Box>
    </VStack>
  );
}
