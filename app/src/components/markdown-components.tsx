import { Show, children, createSignal, onMount, splitProps } from "solid-js";
import type { SolidMarkdownComponents } from "solid-markdown";
import { CheckIcon, CopyIcon } from "lucide-solid";
import { codeToHtml } from "shiki";
import { css } from "styled-system/css";
import { Heading } from "~/components/ui/heading";
import { Link } from "~/components/ui/link";
import { Text } from "~/components/ui/text";
import {
  normalizeCodeText,
  parseLanguage,
  toHeadingId,
} from "~/lib/markdown-utils";
import { markdownTableComponents } from "~/components/markdown-table-components";

const SHIKI_THEME = "github-light";
const CODE_BLOCK_COLLAPSED_HEIGHT = 240;

let mermaidModulePromise: Promise<typeof import("mermaid")> | null = null;

const styles = {
  h1: css({ fontSize: "2xl", fontWeight: "bold", mt: 6, mb: 4 }),
  h2: css({ fontSize: "xl", fontWeight: "semibold", mt: 4, mb: 2 }),
  h3: css({ fontSize: "lg", fontWeight: "medium", mt: 3, mb: 1 }),
  headingTarget: css({
    scrollMarginTop: "96px",
    position: "relative",
    overflow: "visible",
    "& [data-heading-anchor='true']": {
      opacity: 0,
      pointerEvents: "auto",
    },
    "&:hover [data-heading-anchor='true']": {
      opacity: 1,
    },
    "& [data-heading-anchor='true']:hover": {
      opacity: 1,
    },
    "& [data-heading-anchor='true']:focus-visible": {
      opacity: 1,
    },
  }),
  headingAnchor: css({
    position: "absolute",
    left: "-1.1rem",
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0,
    color: "fg.muted",
    textDecoration: "none",
    fontSize: "0.85em",
    transition: "opacity 120ms ease",
    _hover: { color: "fg.default" },
  }),
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
  preWrapper: css({
    position: "relative",
    my: 4,
    borderRadius: "md",
    overflow: "hidden",
  }),
  pre: css({
    fontFamily: "mono",
    bg: "bg.subtle",
    borderRadius: "md",
    overflow: "auto",
    p: 4,
    m: 0,
  }),
  preCollapsed: css({
    maxHeight: `${CODE_BLOCK_COLLAPSED_HEIGHT}px`,
    overflow: "hidden",
  }),
  copyButton: css({
    position: "absolute",
    top: "8px",
    right: "8px",
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    borderWidth: "1px",
    borderColor: "border.default",
    bg: "bg.default",
    color: "fg.default",
    borderRadius: "sm",
    px: "2",
    py: "1",
    fontSize: "xs",
    cursor: "pointer",
    _hover: { bg: "bg.subtle" },
  }),
  fadeOverlay: css({
    position: "absolute",
    bottom: "28px",
    left: 0,
    right: 0,
    height: "40px",
    background:
      "linear-gradient(to bottom, transparent 0%, token(colors.bg.subtle) 100%)",
    pointerEvents: "none",
  }),
  expandButton: css({
    width: "100%",
    py: 1.5,
    px: 4,
    bg: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "xs",
    color: "fg.muted",
    textAlign: "center",
    fontFamily: "sans",
    _hover: {
      color: "fg.default",
      textDecoration: "underline",
    },
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
    "& .code-line": {
      display: "block",
      paddingLeft: "2.5rem",
      position: "relative",
      minHeight: "1.4em",
      whiteSpace: "pre",
    },
    "& .code-line::before": {
      content: "attr(data-line)",
      position: "absolute",
      left: 0,
      width: "2rem",
      textAlign: "right",
      color: "fg.muted",
      userSelect: "none",
    },
  }),
  mermaid: css({
    my: 0,
    px: 4,
    py: 3,
    bg: "bg.default",
    borderTopWidth: "1px",
    borderTopColor: "border.default",
    overflowX: "auto",
  }),
  mermaidError: css({
    px: 4,
    py: 2,
    color: "red.surface.fg",
    bg: "red.surface.bg",
    borderTopWidth: "1px",
    borderTopColor: "red.surface.border",
    fontSize: "sm",
  }),
};

function isBlockCode(className: unknown, inlineProp: unknown): boolean {
  const hasLanguageClass =
    typeof className === "string" && /language-\w+/.test(className);
  if (typeof inlineProp === "boolean") {
    return !inlineProp;
  }
  return hasLanguageClass;
}

function toLineWrappedHtml(codeInnerHtml: string): string {
  const normalized = codeInnerHtml.replace(/\r?\n$/, "");
  const lines = normalized.split("\n");
  return lines
    .map((line, index) => {
      const value = line.length > 0 ? line : " ";
      return `<span class="code-line" data-line="${index + 1}">${value}</span>`;
    })
    .join("");
}

async function getShikiHighlightedCode(
  code: string,
  language: string,
): Promise<string | null> {
  try {
    const html = await codeToHtml(code, { lang: language, theme: SHIKI_THEME });
    const match = /<code[^>]*>([\s\S]*)<\/code>/.exec(html);
    if (!match?.[1]) return null;
    return toLineWrappedHtml(match[1]);
  } catch {
    return null;
  }
}

async function loadMermaid(): Promise<typeof import("mermaid")> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid");
  }
  return mermaidModulePromise;
}

function looksLikeMermaid(code: string): boolean {
  const firstLine = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return false;
  return /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|c4Context|c4Container|c4Component|c4Dynamic|c4Deployment)\b/.test(
    firstLine,
  );
}

function enhanceHeading(headingEl: HTMLElement) {
  const headingText = headingEl.textContent?.trim() ?? "";
  if (!headingText) return;
  const headingId = toHeadingId(headingText);
  if (!headingId) return;
  headingEl.setAttribute("id", headingId);

  const existingAnchor = headingEl.querySelector("[data-heading-anchor='true']");
  if (existingAnchor) return;

  const anchor = document.createElement("a");
  anchor.setAttribute("href", `#${headingId}`);
  anchor.setAttribute("aria-label", "Link to this heading");
  anchor.setAttribute("data-heading-anchor", "true");
  anchor.setAttribute("class", styles.headingAnchor);
  anchor.textContent = "#";
  headingEl.appendChild(anchor);
}

export const markdownComponents = {
  h1: (props) => {
    let headingRef: HTMLElement | undefined;
    onMount(() => {
      if (!headingRef) return;
      enhanceHeading(headingRef);
    });
    return (
      <Heading
        as="h1"
        class={`${styles.h1} ${styles.headingTarget}`}
        ref={(el) => {
          headingRef = el;
        }}
        {...props}
      />
    );
  },
  h2: (props) => {
    let headingRef: HTMLElement | undefined;
    onMount(() => {
      if (!headingRef) return;
      enhanceHeading(headingRef);
    });
    return (
      <Heading
        as="h2"
        class={`${styles.h2} ${styles.headingTarget}`}
        ref={(el) => {
          headingRef = el;
        }}
        {...props}
      />
    );
  },
  h3: (props) => {
    let headingRef: HTMLElement | undefined;
    onMount(() => {
      if (!headingRef) return;
      enhanceHeading(headingRef);
    });
    return (
      <Heading
        as="h3"
        class={`${styles.h3} ${styles.headingTarget}`}
        ref={(el) => {
          headingRef = el;
        }}
        {...props}
      />
    );
  },
  p: (props) => <Text class={styles.p} {...props} />,
  a: (props) => <Link class={styles.a} {...props} />,
  ul: (props) => <ul class={styles.ul} {...props} />,
  ol: (props) => <ol class={styles.ol} {...props} />,
  li: (props) => <li class={styles.li} {...props} />,
  blockquote: (props) => <blockquote class={styles.blockquote} {...props} />,

  pre: (preProps) => {
    const [local, rest] = splitProps(preProps, ["children", "class"]);
    const [isHydrated, setIsHydrated] = createSignal(false);
    const [isCollapsed, setIsCollapsed] = createSignal(true);
    const [needsCollapse, setNeedsCollapse] = createSignal(false);
    const [lineCountLabel, setLineCountLabel] = createSignal<string | null>(
      null,
    );
    const [isCopied, setIsCopied] = createSignal(false);
    const [mermaidSvg, setMermaidSvg] = createSignal<string | null>(null);
    const [mermaidError, setMermaidError] = createSignal<string | null>(null);
    const [mermaidCode, setMermaidCode] = createSignal("");
    let preRef: HTMLPreElement | undefined;

    onMount(() => {
      setIsHydrated(true);
      if (!preRef) return;

      const codeElement = preRef.querySelector("code");
      const language = parseLanguage(
        codeElement?.getAttribute("data-md-language"),
        codeElement?.className,
        preRef.className,
      );
      const rawText = preRef.textContent ?? "";
      setMermaidCode(rawText);
      const isMermaid = language === "mermaid" || looksLikeMermaid(rawText);
      const text = rawText.replace(/\r?\n$/, "");
      const count = text ? text.split(/\r?\n/).length : 0;
      if (count === 1) {
        setLineCountLabel("1 line");
      } else if (count > 1) {
        setLineCountLabel(`${count} lines`);
      }

      if (isMermaid) {
        void (async () => {
          try {
            const module = await loadMermaid();
            module.default.initialize({
              startOnLoad: false,
              securityLevel: "loose",
            });
            const renderId = `mermaid-${crypto.randomUUID()}`;
            const result = await module.default.render(renderId, rawText);
            setMermaidSvg(result.svg);
          } catch (error) {
            console.error("Markdown:mermaid:renderFailed", error);
            setMermaidError(String(error));
          }
        })();
        return;
      }

      if (preRef.scrollHeight > CODE_BLOCK_COLLAPSED_HEIGHT) {
        setNeedsCollapse(true);
      }
    });

    const handleCopy = async () => {
      if (!preRef) return;
      try {
        const text = mermaidSvg() ? mermaidCode() : preRef.textContent ?? "";
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        window.setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      } catch (error) {
        console.error("Markdown:copyCode:error", error);
      }
    };

    const preClass = () => {
      if (needsCollapse() && isCollapsed()) {
        return `${styles.pre} ${styles.preCollapsed}`;
      }
      return styles.pre;
    };

    return (
      <div class={styles.preWrapper}>
        <Show when={isHydrated()}>
          <button type="button" class={styles.copyButton} onClick={handleCopy}>
            <Show when={isCopied()} fallback={<CopyIcon size={14} />}>
              <CheckIcon size={14} />
            </Show>
            <span>{isCopied() ? "Copied" : "Copy"}</span>
          </button>
        </Show>
        <Show when={mermaidSvg()} fallback={<pre class={preClass()} {...rest} ref={preRef}>{local.children}</pre>}>
          {(svg) => <div class={styles.mermaid} innerHTML={svg()} />}
        </Show>
        <Show when={mermaidError()}>
          {(value) => (
            <div class={styles.mermaidError}>Mermaid render failed: {value()}</div>
          )}
        </Show>
        <Show when={isHydrated() && needsCollapse() && isCollapsed()}>
          <div class={styles.fadeOverlay} />
        </Show>
        <Show when={isHydrated() && needsCollapse()}>
          <button
            type="button"
            class={styles.expandButton}
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed()
              ? lineCountLabel()
                ? `Show more • ${lineCountLabel()}`
                : "Show more"
              : "Show less"}
          </button>
        </Show>
      </div>
    );
  },

  code: (codeProps) => {
    const [local, rest] = splitProps(codeProps, [
      "children",
      "node",
      "class",
      "inline",
    ]);
    const [highlightedCode, setHighlightedCode] = createSignal<string | null>(
      null,
    );
    const resolvedChildren = children(() => local.children);
    const codeText = () => normalizeCodeText(resolvedChildren(), local.node);

    if (!isBlockCode(local.class, local.inline)) {
      return (
        <code class={styles.inlineCode} {...rest}>
          {codeText()}
        </code>
      );
    }

    const language = parseLanguage(local.class);

    onMount(() => {
      if (language === "mermaid") return;
      const code = codeText();
      if (!code) return;
      getShikiHighlightedCode(code, language)
        .then((value) => {
          setHighlightedCode(value);
        })
        .catch(() => {
          setHighlightedCode(null);
        });
    });

    return (
      <code class={styles.blockCode} {...rest} data-md-language={language}>
        <Show when={highlightedCode()} fallback={codeText()}>
          {(value) => <span innerHTML={value()} />}
        </Show>
      </code>
    );
  },

  ...markdownTableComponents,
} satisfies SolidMarkdownComponents;
