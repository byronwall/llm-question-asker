import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";
import "./index.css";

export default function App() {
  console.log("App component running! Client:", typeof window !== "undefined");
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Box class={css({ minH: "dvh" })}>
            <Suspense>{props.children}</Suspense>
          </Box>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
