import { Router, Route } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { Suspense } from "solid-js";
import { css } from "styled-system/css";
import { Box } from "styled-system/jsx";
import HomeRoute from "./routes/index";
import "./index.css";

export default function App() {
  console.log("App component running! Client:", typeof window !== "undefined");
  return (
    <MetaProvider>
      <Router
        root={(props) => (
          <Box class={css({ minH: "dvh" })}>
            <Suspense>{props.children}</Suspense>
          </Box>
        )}
      >
        <Route path="/" component={HomeRoute} />
      </Router>
    </MetaProvider>
  );
}
