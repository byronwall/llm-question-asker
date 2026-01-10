import { Meta, Title } from "@solidjs/meta";
import {
  getDefaultMetadata,
  type PageMetadata,
} from "~/lib/site-meta";

type Props = PageMetadata;

export function PageMeta(props: Props) {
  const meta = () => getDefaultMetadata(props);

  return (
    <>
      <Title>{meta().title}</Title>
      <Meta name="description" content={meta().description} />

      {/* Open Graph */}
      <Meta property="og:type" content={meta().type} />
      <Meta property="og:title" content={meta().title} />
      <Meta property="og:description" content={meta().description} />
      <Meta property="og:image" content={meta().image} />
      <Meta property="og:url" content={meta().url} />

      {/* Twitter Card */}
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={meta().title} />
      <Meta name="twitter:description" content={meta().description} />
      <Meta name="twitter:image" content={meta().image} />

      {/* Canonical URL */}
      <link rel="canonical" href={meta().url} />
    </>
  );
}
