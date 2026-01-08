import { Box } from "styled-system/jsx";
import { css } from "styled-system/css";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { MarkdownRenderer } from "../MarkdownRenderer";

type SessionHeaderProps = {
  prompt: string;
};

export function SessionHeader(props: SessionHeaderProps) {
  return (
    <Box>
      <Heading as="h1" class={css({ fontSize: "2xl", mb: "2" })}>
        Consultation Session
      </Heading>
      <MarkdownRenderer>{props.prompt}</MarkdownRenderer>
    </Box>
  );
}
