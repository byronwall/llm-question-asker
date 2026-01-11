import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";

import { JobProvider } from "~/components/jobs/job-context";
import { JobsHeader } from "~/components/jobs/JobsHeader";
import { Toaster } from "~/components/ui/toast";

import "./index.css";

export default function App() {
  console.log("App component running! Client:", typeof window !== "undefined");
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <JobProvider>
            <Box class={css({ minH: "dvh" })}>
              <JobsHeader />
              <Suspense>{props.children}</Suspense>
            </Box>
            <Toaster />
          </JobProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
