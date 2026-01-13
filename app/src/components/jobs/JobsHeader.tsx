import { A } from "@solidjs/router";
import { css } from "styled-system/css";
import { HStack, Box } from "styled-system/jsx";

import { JobsIndicator } from "./JobsIndicator";
import { SITE_NAME } from "~/lib/site-meta";

export function JobsHeader() {
  return (
    <Box
      class={css({
        position: "sticky",
        top: "0",
        zIndex: "100",
        bg: "white",
        borderBottom: "1px solid",
        borderColor: "gray.200",
        px: "4",
        py: "3",
      })}
    >
      <HStack justify="space-between" maxW="4xl" mx="auto">
        <A
          href="/"
          class={css({
            fontSize: "lg",
            fontWeight: "semibold",
            color: "gray.800",
            textDecoration: "none",
            _hover: { color: "blue.600" },
          })}
        >
          {SITE_NAME}
        </A>
        <JobsIndicator />
      </HStack>
    </Box>
  );
}
