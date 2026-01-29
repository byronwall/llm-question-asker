import { HStack, Stack } from "styled-system/jsx";
import * as Field from "~/components/ui/field";
import { Text } from "~/components/ui/text";
import { Textarea } from "~/components/ui/textarea";

type AdditionalCommentsCardProps = {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function AdditionalCommentsCard(props: AdditionalCommentsCardProps) {
  const handleInput = (event: InputEvent) => {
    const target = event.currentTarget as HTMLTextAreaElement;
    props.onChange(target.value);
  };

  const handleBlur = () => {
    props.onBlur();
  };

  return (
    <Stack gap="2">
      <Field.Root>
        <Field.Label>
          <HStack gap="2" alignItems="flex-end">
            <Text fontSize="3xl" fontWeight="bold" lineHeight="1">
              +1
            </Text>
            <Text fontWeight="bold">{props.label}</Text>
          </HStack>
        </Field.Label>
        <Textarea
          autoresize
          placeholder="Share any extra details..."
          value={props.value}
          onInput={handleInput}
          onBlur={handleBlur}
          disabled={props.disabled}
        />
      </Field.Root>
    </Stack>
  );
}
