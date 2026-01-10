import { For, Show } from "solid-js";
import { Box, HStack, Stack } from "styled-system/jsx";
import * as Checkbox from "~/components/ui/checkbox";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";
import { IconButton } from "~/components/ui/icon-button";
import { Badge } from "~/components/ui/badge";
import { Trash2 } from "lucide-solid";
import type { Answer, Question, QuestionType } from "~/lib/domain";
import { useConsultation } from "./consultation-context";

type QuestionCardProps = {
  question: Question;
  answer: Answer | undefined;
  disabled: boolean;
  hasResult: boolean;
};

function getQuestionTypeLabel(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    goal_discovery: "Goal Discovery",
    user_goals: "Context",
    output_related: "Output Format",
  };
  return labels[type];
}

export function QuestionCard(props: QuestionCardProps) {
  const ctx = useConsultation();

  const customInputValue = () => props.answer?.customInput ?? "";

  const isAnswered = () => {
    const answer = props.answer;
    if (!answer) return false;
    return (
      answer.selectedOptionIds.length > 0 ||
      (answer.customInput !== null && answer.customInput.trim() !== "")
    );
  };

  const showDeleteButton = () => {
    return !props.hasResult && !props.disabled && !isAnswered();
  };

  const handleCustomInputChange = (value: string) => {
    console.log(
      "QuestionCard:handleCustomInputChange",
      props.question.id,
      value
    );
    ctx.handleCustomInput(props.question.id, value);
  };

  const handleDelete = () => {
    console.log("QuestionCard:handleDelete", props.question.id);
    if (!props.disabled) {
      ctx.handleDeleteQuestion(props.question.id);
    }
  };

  return (
    <Stack gap="4">
      <HStack justifyContent="space-between" alignItems="flex-start">
        <Stack gap="2" flex="1">
          <HStack gap="2" alignItems="center">
            <Badge size="sm" variant="subtle">
              {getQuestionTypeLabel(props.question.type)}
            </Badge>
          </HStack>
          <Text fontWeight="bold">{props.question.text}</Text>
        </Stack>
        <Show when={showDeleteButton()}>
          <IconButton
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={props.disabled}
            aria-label="Delete question"
            css={{
              color: "red.600",
              opacity: 0.6,
              _hover: { opacity: 1, borderColor: "red.600" },
            }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Show>
      </HStack>
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
