import { children, splitProps, onMount } from "solid-js";
import type { SolidMarkdownComponents } from "solid-markdown";
import { codeToHtml } from "shiki";
import { css } from "styled-system/css";
import { Heading } from "~/components/ui/heading";
import { Text } from "~/components/ui/text";
import { Link } from "~/components/ui/link";
import { markdownTableComponents } from "~/components/markdown-table-components";
import { normalizeCodeText, parseLanguage } from "~/lib/markdown-utils";

const SHIKI_THEME = "github-light";

// Styles
const styles = {
  h1: css({ fontSize: "2xl", fontWeight: "bold", mt: 6, mb: 4 }),
  h2: css({ fontSize: "xl", fontWeight: "semibold", mt: 4, mb: 2 }),
  h3: css({ fontSize: "lg", fontWeight: "medium", mt: 3, mb: 1 }),
  p: css({ fontSize: "md", lineHeight: "relaxed", mb: 3 }),
  a: css({ color: "accent.default", textDecoration: "underline" }),
  ul: css({ listStyleType: "disc", pl: 6, mb: 4 }),
  ol: css({ listStyleType: "decimal", pl: 6, mb: 4 }),
  li: css({ mb: 1 }),
  blockquote: css({
    borderLeftWidth: "4px",
    borderLeftColor: "border.subtle",
    pl: 4,
    py: 1,
    my: 4,
    fontStyle: "italic",
    color: "fg.muted",
  }),
  pre: css({
    fontFamily: "mono",
    bg: "bg.subtle",
    borderRadius: "md",
    overflow: "auto",
    p: 4,
    my: 4,
  }),
  inlineCode: css({
    fontFamily: "mono",
    bg: "bg.subtle",
    px: 1.5,
    py: 0.5,
    borderRadius: "sm",
    fontSize: "sm",
  }),
  blockCode: css({
    fontFamily: "mono",
    fontSize: "sm",
    lineHeight: "relaxed",
    display: "block",
  }),
};

/**
 * Applies Shiki syntax highlighting to a code element after mount.
 * This is done via ref to avoid SSR hydration mismatches.
 */
function applyShikiHighlighting(
  codeRef: HTMLElement,
  code: string,
  language: string
) {
  codeToHtml(code, { lang: language, theme: SHIKI_THEME })
    .then((html) => {
      // Extract inner content from Shiki's <pre><code>...</code></pre> output
      const match = /<code[^>]*>([\s\S]*)<\/code>/.exec(html);
      if (match) {
        codeRef.innerHTML = match[1];
      }
    })
    .catch(() => {
      // Keep plain text on error - already rendered
    });
}

/**
 * Checks if a code element is a block code (inside <pre>) vs inline code.
 * Block code has a language-* class from markdown fenced code blocks.
 */
function isBlockCode(className: unknown, inlineProp: unknown): boolean {
  const hasLanguageClass =
    typeof className === "string" && /language-\w+/.test(className);
  if (typeof inlineProp === "boolean") {
    return !inlineProp;
  }
  return hasLanguageClass;
}

export const markdownComponents = {
  h1: (props) => <Heading as="h1" class={styles.h1} {...props} />,
  h2: (props) => <Heading as="h2" class={styles.h2} {...props} />,
  h3: (props) => <Heading as="h3" class={styles.h3} {...props} />,
  p: (props) => <Text class={styles.p} {...props} />,
  a: (props) => <Link class={styles.a} {...props} />,
  ul: (props) => <ul class={styles.ul} {...props} />,
  ol: (props) => <ol class={styles.ol} {...props} />,
  li: (props) => <li class={styles.li} {...props} />,
  blockquote: (props) => <blockquote class={styles.blockquote} {...props} />,

  pre: (preProps) => {
    const [local, rest] = splitProps(preProps, ["node", "children", "class"]);
    // Always render plain pre to avoid SSR hydration mismatch
    // Code highlighting is applied inside the code element after mount
    return (
      <pre class={styles.pre} {...rest}>
        {local.children}
      </pre>
    );
  },

  code: (codeProps) => {
    const [local, rest] = splitProps(codeProps, [
      "node",
      "children",
      "inline",
      "class",
    ]);
    const resolvedChildren = children(() => local.children);
    const codeText = () => normalizeCodeText(resolvedChildren(), local.node);

    // Inline code: simple styled element
    if (!isBlockCode(local.class, local.inline)) {
      return (
        <code class={styles.inlineCode} {...rest}>
          {codeText()}
        </code>
      );
    }

    // Block code: progressive enhancement with Shiki
    const language = parseLanguage(local.class);
    let codeRef: HTMLElement | undefined;

    onMount(() => {
      if (!codeRef) return;
      const code = codeText();
      if (code) {
        applyShikiHighlighting(codeRef, code, language);
      }
    });

    return (
      <code class={styles.blockCode} {...rest} ref={codeRef}>
        {codeText()}
      </code>
    );
  },

  ...markdownTableComponents,
} satisfies SolidMarkdownComponents;
