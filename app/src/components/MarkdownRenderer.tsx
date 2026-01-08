import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Link } from "~/components/ui/link";
import { css } from "styled-system/css";

interface MarkdownRendererProps {
  children?: string | null;
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  return (
    <SolidMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props) => (
          <Heading
            as="h1"
            class={css({ fontSize: "2xl", fontWeight: "bold", mt: 6, mb: 4 })}
            {...props}
          />
        ),
        h2: (props) => (
          <Heading
            as="h2"
            class={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mt: 5,
              mb: 3,
            })}
            {...props}
          />
        ),
        h3: (props) => (
          <Heading
            as="h3"
            class={css({ fontSize: "lg", fontWeight: "medium", mt: 4, mb: 2 })}
            {...props}
          />
        ),
        p: (props) => (
          <Text
            class={css({ fontSize: "md", lineHeight: "relaxed", mb: 4 })}
            {...props}
          />
        ),
        a: (props) => (
          <Link
            class={css({
              color: "accent.default",
              textDecoration: "underline",
            })}
            {...props}
          />
        ),
        ul: (props) => (
          <ul class={css({ listStyleType: "disc", pl: 6, mb: 4 })} {...props} />
        ),
        ol: (props) => (
          <ol
            class={css({ listStyleType: "decimal", pl: 6, mb: 4 })}
            {...props}
          />
        ),
        li: (props) => <li class={css({ mb: 1 })} {...props} />,
        blockquote: (props) => (
          <blockquote
            class={css({
              borderLeftWidth: "4px",
              borderLeftColor: "border.subtle",
              pl: 4,
              py: 1,
              my: 4,
              fontStyle: "italic",
              color: "fg.muted",
            })}
            {...props}
          />
        ),
        code: (props) => {
          const { children, className } = props;
          const isInline = !className; // Basic check, remark typically adds language classes to blocks
          return (
            <code
              class={css({
                fontFamily: "mono",
                bg: "bg.subtle",
                px: 1.5,
                py: 0.5,
                borderRadius: "sm",
                fontSize: "sm",
                display: isInline ? "inline" : "block",
                overflowX: isInline ? undefined : "auto",
                p: isInline ? undefined : 4,
              })}
              {...props}
            />
          );
        },
      }}
    >
      {props.children ?? ""}
    </SolidMarkdown>
  );
}
