import { A } from "@solidjs/router";
import { css } from "styled-system/css";
import { HStack, Box } from "styled-system/jsx";

import { JobsIndicator } from "./JobsIndicator";

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
        py: "2",
      })}
    >
      <HStack justify="space-between" maxW="6xl" mx="auto">
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
          Prod Ideator
        </A>
        <JobsIndicator />
      </HStack>
    </Box>
  );
}
