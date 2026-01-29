import { Stack } from "styled-system/jsx";
import * as Field from "~/components/ui/field";
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
        <Field.Label fontWeight="bold">{props.label}</Field.Label>
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
