import { createSignal, createMemo, onMount, onCleanup, For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Box, Stack } from "styled-system/jsx";

type TocHeading = {
  id: string;
  text: string;
  level: number;
};

type TableOfContentsProps = {
  markdown: string;
  contentRef?: HTMLElement;
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function removeCodeBlocks(markdown: string): string {
  let result = markdown.replace(/```[\s\S]*?```/g, "");
  result = result.replace(/^(?: {4}|\t).+$/gm, "");
  return result;
}

function extractHeadings(markdown: string): TocHeading[] {
  const cleanMarkdown = removeCodeBlocks(markdown);
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  const slugCounts = new Map<string, number>();

  let match;
  while ((match = headingRegex.exec(cleanMarkdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const baseSlug = generateSlug(text);

    const count = slugCounts.get(baseSlug) || 0;
    const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;
    slugCounts.set(baseSlug, count + 1);

    headings.push({ id: slug, text, level });
  }

  return headings;
}

export function TableOfContents(props: TableOfContentsProps) {
  const [activeId, setActiveId] = createSignal<string | null>(null);
  const [viewportTop, setViewportTop] = createSignal(0);
  const [viewportBottom, setViewportBottom] = createSignal(0);
  const [headingsReady, setHeadingsReady] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(true);
  const [contentLeft, setContentLeft] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(800);

  const headings = createMemo(() => extractHeadings(props.markdown));

  const addHeadingIds = () => {
    const container = props.contentRef;
    if (!container) return;

    const headingElements = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const slugCounts = new Map<string, number>();

    headingElements.forEach((el) => {
      const text = el.textContent || "";
      const baseSlug = generateSlug(text);

      const count = slugCounts.get(baseSlug) || 0;
      const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;
      slugCounts.set(baseSlug, count + 1);

      el.id = slug;
    });

    console.log("TableOfContents:addHeadingIds", headingElements.length);
    setHeadingsReady(true);
  };

  const handleScroll = () => {
    const container = props.contentRef;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight;
    setViewportHeight(vh);

    // TOC should be visible only when content is on screen
    const visible = rect.bottom > 0 && rect.top < vh;
    setIsVisible(visible);

    // Update content left position for TOC placement
    setContentLeft(rect.left);

    // Calculate viewport indicator relative to content
    if (headingsReady()) {
      const contentTop = rect.top;
      const contentHeight = rect.height;

      // Calculate what percentage of content is above viewport
      const topPercent = Math.max(0, Math.min(100, (-contentTop / contentHeight) * 100));
      // Calculate what percentage of content is visible
      const visibleBottom = Math.min(vh - contentTop, contentHeight);
      const bottomPercent = Math.max(0, Math.min(100, (visibleBottom / contentHeight) * 100));

      setViewportTop(topPercent);
      setViewportBottom(bottomPercent);

      // Find active heading
      let activeHeading: string | null = null;
      for (const h of headings()) {
        const element = document.getElementById(h.id);
        if (element) {
          const headingRect = element.getBoundingClientRect();
          if (headingRect.top <= 100) {
            activeHeading = h.id;
          }
        }
      }
      setActiveId(activeHeading);
    }
  };

  onMount(() => {
    console.log("TableOfContents:onMount");

    requestAnimationFrame(() => {
      addHeadingIds();
      handleScroll();
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    onCleanup(() => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    });
  });

  const handleClick = (id: string) => {
    console.log("TableOfContents:handleClick", id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getIndent = (level: number) => (level - 1) * 12;

  const getFontSize = (level: number) => {
    if (level === 1) return "14px";
    if (level === 2) return "13px";
    return "12px";
  };

  return (
    <Show when={headings().length > 0 && isVisible()}>
      <Box
        class={css({
          position: "fixed",
          top: 0,
          width: "200px",
          height: "100vh",
          zIndex: 10,
          display: { base: "none", xl: "block" },
          overflowY: "auto",
          py: "4",
        })}
        style={{
          left: `${Math.max(8, contentLeft() - 220)}px`,
        }}
      >
        {/* Progress track background - spans the heading list height */}
        <Box
          class={css({
            position: "absolute",
            left: "4px",
            top: "4",
            bottom: "4",
            width: "2px",
            bg: "border.subtle",
            borderRadius: "full",
          })}
        />

        {/* Viewport indicator - shows current scroll position relative to content */}
        <Box
          class={css({
            position: "absolute",
            left: "4px",
            width: "2px",
            bg: "fg.default",
            borderRadius: "full",
            transition: "top 0.1s ease-out, height 0.1s ease-out",
          })}
          style={{
            top: `${16 + (viewportTop() / 100) * (viewportHeight() - 32)}px`,
            height: `${Math.max(4, ((viewportBottom() - viewportTop()) / 100) * (viewportHeight() - 32))}px`,
          }}
        />

        <Stack gap="1" pl="4">
          <For each={headings()}>
            {(heading) => {
              const isActive = () => activeId() === heading.id;
              const indent = () => getIndent(heading.level);

              return (
                <Box
                  class={css({
                    position: "relative",
                    cursor: "pointer",
                    py: "1",
                    transition: "color 0.15s",
                    _hover: {
                      color: "fg.default",
                    },
                  })}
                  style={{
                    "padding-left": `${indent()}px`,
                    color: isActive()
                      ? "var(--colors-fg-default)"
                      : "var(--colors-fg-muted)",
                    "font-weight": isActive() ? "500" : "400",
                  }}
                  onClick={() => handleClick(heading.id)}
                >
                  {/* Bullet indicator */}
                  <Box
                    class={css({
                      position: "absolute",
                      left: "-12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "4px",
                      height: "4px",
                      borderRadius: "full",
                      transition: "background-color 0.15s",
                    })}
                    style={{
                      "background-color": isActive()
                        ? "var(--colors-fg-default)"
                        : "var(--colors-fg-muted)",
                    }}
                  />
                  <Box
                    class={css({
                      lineHeight: "snug",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    })}
                    style={{
                      "font-size": getFontSize(heading.level),
                    }}
                  >
                    {heading.text}
                  </Box>
                </Box>
              );
            }}
          </For>
        </Stack>
      </Box>
    </Show>
  );
}
