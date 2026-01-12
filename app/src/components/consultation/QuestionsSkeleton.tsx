import { For, Show, splitProps } from "solid-js";
import { Stack } from "styled-system/jsx";
import * as Card from "~/components/ui/card";
import { Skeleton, SkeletonText } from "~/components/ui/skeleton";

type QuestionsSkeletonProps = {
  count?: number;
  title?: string;
  description?: string;
  withCard?: boolean;
};

export function QuestionsSkeleton(props: QuestionsSkeletonProps) {
  const [local] = splitProps(props, [
    "count",
    "title",
    "description",
    "withCard",
  ]);
  const count = () => local.count ?? 3;
  const withCard = () => local.withCard ?? true;

  const skeletonList = () => (
    <Stack gap="8">
      <For each={[...Array(count()).keys()]}>
        {() => (
          <Stack gap="3">
            <Skeleton height="5" width="120px" />
            <SkeletonText noOfLines={2} />
            <Stack gap="2">
              <Skeleton height="4" width="70%" />
              <Skeleton height="4" width="60%" />
              <Skeleton height="4" width="55%" />
            </Stack>
            <Skeleton height="10" />
          </Stack>
        )}
      </For>
    </Stack>
  );

  return (
    <Show when={withCard()} fallback={skeletonList()}>
      <Card.Root>
        <Card.Header>
          <Card.Title>{local.title ?? "Questions"}</Card.Title>
          <Show when={local.description}>
            <Card.Description>{local.description}</Card.Description>
          </Show>
        </Card.Header>
        <Card.Body>{skeletonList()}</Card.Body>
      </Card.Root>
    </Show>
  );
}
