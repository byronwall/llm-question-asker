import { eventHandler } from "vinxi/http";

import { watch, type FSWatcher } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { JobSocketServerMessage } from "../lib/job-socket-messages";
import type { Job } from "../lib/job-types";
import { jobsDb } from "../server/jobs-db";

const sendMessage = (peer: Peer, message: JobSocketServerMessage) => {
  peer.send(JSON.stringify(message));
};

const peers = new Set<Peer>();
const pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
let watcher: FSWatcher | null = null;

const getJobsDirPath = () => path.join(process.cwd(), "data", "jobs");

const broadcastJob = (job: Job) => {
  for (const peer of peers) {
    try {
      sendMessage(peer, { type: "jobs:update", job });
    } catch (err) {
      console.error("job-socket:broadcast:error", { id: peer.id, err });
    }
  }
};

const scheduleJobBroadcast = (jobId: string) => {
  const existing = pendingUpdates.get(jobId);
  if (existing) {
    clearTimeout(existing);
  }
  const timeout = setTimeout(async () => {
    pendingUpdates.delete(jobId);
    const job = await jobsDb().getJob(jobId);
    if (!job) return;
    broadcastJob(job);
  }, 50);
  pendingUpdates.set(jobId, timeout);
};

const handleWatchEvent = (eventType: string, filename?: string | Buffer) => {
  if (!filename) return;
  const name = typeof filename === "string" ? filename : filename.toString();
  if (!name.endsWith(".json")) return;
  const jobId = name.slice(0, -".json".length);
  console.log("job-socket:watch", { eventType, jobId });
  scheduleJobBroadcast(jobId);
};

const ensureWatcher = async () => {
  if (watcher) return;
  const dir = getJobsDirPath();
  await mkdir(dir, { recursive: true });
  watcher = watch(dir, handleWatchEvent);
  watcher.on("error", (err) => {
    console.error("job-socket:watcher:error", err);
  });
  console.log("job-socket:watcher:start", { dir });
};

const stopWatcherIfIdle = () => {
  if (peers.size > 0) return;
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log("job-socket:watcher:stop");
  }
  for (const timeout of pendingUpdates.values()) {
    clearTimeout(timeout);
  }
  pendingUpdates.clear();
};

type Peer = Parameters<
  NonNullable<
    NonNullable<Parameters<typeof eventHandler>[0]["__websocket__"]>["open"]
  >
>[0];

const handler = eventHandler({
  handler() {},
  websocket: {
    async open(peer) {
      console.log("job-socket:open", { id: peer.id, url: peer.request.url });
      peers.add(peer);
      await ensureWatcher();
      try {
        const activeJobs = await jobsDb().listActiveJobs();
        sendMessage(peer, { type: "jobs:init", jobs: activeJobs });
      } catch (err) {
        console.error("job-socket:init:error", err);
      }
    },
    close(peer, details) {
      console.log("job-socket:close", {
        id: peer.id,
        url: peer.request.url,
        code: details.code,
        reason: details.reason,
      });
      peers.delete(peer);
      stopWatcherIfIdle();
    },
    message(peer, message) {
      console.log("job-socket:message", {
        id: peer.id,
        url: peer.request.url,
        hasData: !!message,
      });
    },
    error(peer, error) {
      console.error("job-socket:error", {
        id: peer.id,
        url: peer.request.url,
        error,
      });
    },
  },
});

export default handler;
