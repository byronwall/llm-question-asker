import { For } from "solid-js";
import { Box, HStack, Stack } from "styled-system/jsx";
import * as Checkbox from "~/components/ui/checkbox";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import type { Answer, Question } from "~/lib/domain";
import { useConsultation } from "./consultation-context";

type QuestionCardProps = {
  question: Question;
  answer: Answer | undefined;
  disabled: boolean;
};

export function QuestionCard(props: QuestionCardProps) {
  const ctx = useConsultation();

  const customInputValue = () => props.answer?.customInput ?? "";

  const handleCustomInputChange = (value: string) => {
    console.log(
      "QuestionCard:handleCustomInputChange",
      props.question.id,
      value
    );
    ctx.handleCustomInput(props.question.id, value);
  };

  return (
    <Stack gap="4">
      <Text fontWeight="bold">{props.question.text}</Text>
      <Stack gap="2">
        <For each={props.question.options}>
          {(option) => {
            const optionId = () => option.id;
            const optionText = () => option.text;
            const isChecked = () =>
              props.answer?.selectedOptionIds.includes(optionId()) ?? false;

            return (
              <HStack gap="3">
                <Checkbox.Root
                  checked={isChecked()}
                  onCheckedChange={() => {
                    if (!props.disabled) {
                      ctx.handleToggleOption(props.question.id, optionId());
                    }
                  }}
                  disabled={props.disabled}
                >
                  <Checkbox.Control />
                  <Checkbox.Label>{optionText()}</Checkbox.Label>
                  <Checkbox.HiddenInput />
                </Checkbox.Root>
              </HStack>
            );
          }}
        </For>

        <Box pl="7">
          <Textarea
            autoresize
            placeholder="Other (please specify)..."
            value={customInputValue()}
            onInput={(e) => handleCustomInputChange(e.currentTarget.value)}
            disabled={props.disabled}
          />
        </Box>
      </Stack>
    </Stack>
  );
}
