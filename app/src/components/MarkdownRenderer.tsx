import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Link } from "~/components/ui/link";
import { css } from "styled-system/css";

type MarkdownRendererProps = {
  children?: string | null;
};

export function MarkdownRenderer(props: MarkdownRendererProps) {
  return (
    <SolidMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (hProps) => (
          <Heading
            as="h1"
            class={css({ fontSize: "2xl", fontWeight: "bold", mt: 6, mb: 4 })}
            {...hProps}
          />
        ),
        h2: (hProps) => (
          <Heading
            as="h2"
            class={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mt: 5,
              mb: 3,
            })}
            {...hProps}
          />
        ),
        h3: (hProps) => (
          <Heading
            as="h3"
            class={css({ fontSize: "lg", fontWeight: "medium", mt: 4, mb: 2 })}
            {...hProps}
          />
        ),
        p: (pProps) => (
          <Text
            class={css({ fontSize: "md", lineHeight: "relaxed", mb: 4 })}
            {...pProps}
          />
        ),
        a: (aProps) => (
          <Link
            class={css({
              color: "accent.default",
              textDecoration: "underline",
            })}
            {...aProps}
          />
        ),
        ul: (ulProps) => (
          <ul
            class={css({ listStyleType: "disc", pl: 6, mb: 4 })}
            {...ulProps}
          />
        ),
        ol: (olProps) => (
          <ol
            class={css({ listStyleType: "decimal", pl: 6, mb: 4 })}
            {...olProps}
          />
        ),
        li: (liProps) => <li class={css({ mb: 1 })} {...liProps} />,
        blockquote: (bqProps) => (
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
            {...bqProps}
          />
        ),
        code: (codeProps) => {
          const isInline = codeProps.inline ?? true;
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
              {...codeProps}
            />
          );
        },
      }}
    >
      {props.children ?? ""}
    </SolidMarkdown>
  );
}
