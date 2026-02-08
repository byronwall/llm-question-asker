import {
  createContext,
  useContext,
  type Accessor,
  type ParentProps,
  createSignal,
  createMemo,
  batch,
  onCleanup,
  onMount,
} from "solid-js";
import { createStore } from "solid-js/store";
import { revalidate } from "@solidjs/router";

import type { Job } from "~/lib/job-types";
import { isActiveStage, STALL_THRESHOLD_MS } from "~/lib/job-types";
import { getActiveJobs, getJob, cancelJob } from "~/server/job-actions";
import { toaster } from "~/components/ui/toast";
import { createJobSocketClient } from "~/lib/job-socket-client";
import type { JobSocketServerMessage } from "~/lib/job-socket-messages";

export type JobController = {
  jobs: Accessor<Job[]>;
  activeJobCount: Accessor<number>;
  hasActiveJobs: Accessor<boolean>;
  stalledJobs: Accessor<Job[]>;
  isJobsPanelOpen: Accessor<boolean>;
  setJobsPanelOpen: (open: boolean) => void;
  cancelJob: (jobId: string) => Promise<void>;
  addJobToWatch: (jobId: string) => void;
  getJobById: (jobId: string) => Job | undefined;
  refreshJobs: () => Promise<void>;
};

const Ctx = createContext<JobController>();

export function JobProvider(props: ParentProps) {
  console.log("JobProvider:init");

  const [jobsById, setJobsById] = createStore<Record<string, Job>>({});
  const [activeJobIds, setActiveJobIds] = createSignal<string[]>([]);
  const [isJobsPanelOpen, setJobsPanelOpen] = createSignal(false);
  const [watchedJobIds, setWatchedJobIds] = createSignal<Set<string>>(
    new Set()
  );

  const activeJobs = createMemo(() =>
    activeJobIds()
      .map((jobId) => jobsById[jobId])
      .filter((job): job is Job => !!job)
  );
  const activeJobCount = () => activeJobs().length;
  const hasActiveJobs = () => activeJobCount() > 0;

  const stalledJobs = createMemo(() => {
    const now = Date.now();
    return activeJobs().filter((job) => {
      if (!job.stageStartedAt) return false;
      const stageStart = new Date(job.stageStartedAt).getTime();
      return now - stageStart > STALL_THRESHOLD_MS;
    });
  });

  const sortJobIds = (ids: string[]) => {
    const unique = Array.from(new Set(ids));
    return unique.sort((a, b) =>
      (jobsById[b]?.createdAt ?? "").localeCompare(jobsById[a]?.createdAt ?? "")
    );
  };

  const applyActiveJobsSnapshot = (activeJobsList: Job[]) => {
    const sorted = [...activeJobsList].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    batch(() => {
      for (const job of sorted) {
        setJobsById(job.id, job);
      }
      setActiveJobIds(sorted.map((job) => job.id));
    });
  };

  const handleJobUpdate = (job: Job) => {
    batch(() => {
      setJobsById(job.id, job);
      if (isActiveStage(job.stage)) {
        setActiveJobIds((prev) => sortJobIds([...prev, job.id]));
      } else {
        setActiveJobIds((prev) => prev.filter((id) => id !== job.id));
        if (watchedJobIds().has(job.id)) {
          setWatchedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(job.id);
            return next;
          });
        }
      }
    });
  };

  const fetchJobs = async () => {
    try {
      // Force cache invalidation first
      await revalidate(getActiveJobs.key);
      const activeJobsList = await getActiveJobs();
      console.log("JobProvider:fetchJobs", { count: activeJobsList.length });

      const prevJobs = [...activeJobs()];

      applyActiveJobsSnapshot(activeJobsList);

      for (const job of activeJobsList) {
        const prevJob = prevJobs.find((j) => j.id === job.id);
        if (prevJob && prevJob.stage !== job.stage) {
          console.log("JobProvider:stageChanged", {
            jobId: job.id,
            from: prevJob.stage,
            to: job.stage,
          });
        }
      }

      // Clean up watched job IDs for completed jobs
      for (const prevJob of prevJobs) {
        const stillActive = activeJobsList.find((j) => j.id === prevJob.id);
        if (!stillActive && watchedJobIds().has(prevJob.id)) {
          const terminalJob = await getJob(prevJob.id);
          if (terminalJob) {
            handleJobUpdate(terminalJob);
          }
        }
      }

      const activeJobIdsSet = new Set(activeJobsList.map((job) => job.id));
      const watchedIds = [...watchedJobIds()];
      for (const watchedId of watchedIds) {
        if (activeJobIdsSet.has(watchedId)) continue;
        const watchedJob = await getJob(watchedId);
        if (watchedJob) {
          handleJobUpdate(watchedJob);
        }
      }
    } catch (err) {
      console.error("JobProvider:fetchJobs:error", err);
    }
  };

  const handleSocketMessage = (message: JobSocketServerMessage) => {
    if (message.type === "jobs:init") {
      console.log("JobProvider:socket:init", {
        count: message.jobs.length,
      });
      applyActiveJobsSnapshot(message.jobs);
      return;
    }

    if (message.type === "jobs:update") {
      handleJobUpdate(message.job);
    }
  };

  onMount(() => {
    if (typeof window === "undefined") return;
    console.log("JobProvider:mount:socket");
    const socket = createJobSocketClient({
      path: "/ws/jobs",
      onMessage: handleSocketMessage,
      onStatus: (status) => {
        console.log("JobProvider:socket:status", { status });
      },
    });
    socket.connect();
    fetchJobs();

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      console.log("JobProvider:visibility:refresh");
      socket.connect();
      fetchJobs();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    onCleanup(() => {
      console.log("JobProvider:mount:cleanup");
      document.removeEventListener("visibilitychange", handleVisibility);
      socket.close();
    });
  });

  const handleCancelJob = async (jobId: string) => {
    console.log("JobProvider:cancelJob", { jobId });
    try {
      await cancelJob(jobId);
      await fetchJobs();
      toaster.create({
        title: "Job cancelled",
        type: "warning",
        duration: 3000,
      });
    } catch (err) {
      console.error("JobProvider:cancelJob:error", err);
      toaster.create({
        title: "Failed to cancel job",
        description: String(err),
        type: "error",
        duration: 5000,
      });
    }
  };

  const addJobToWatch = (jobId: string) => {
    console.log("JobProvider:addJobToWatch", { jobId });
    setWatchedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });
    fetchJobs();
  };

  const getJobById = (jobId: string) => {
    return jobsById[jobId];
  };

  const value = createMemo<JobController>(() => ({
    jobs: () => activeJobs(),
    activeJobCount,
    hasActiveJobs,
    stalledJobs,
    isJobsPanelOpen,
    setJobsPanelOpen,
    cancelJob: handleCancelJob,
    addJobToWatch,
    getJobById,
    refreshJobs: fetchJobs,
  }));

  return <Ctx.Provider value={value()}>{props.children}</Ctx.Provider>;
}

export function useJobs() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return ctx;
}
