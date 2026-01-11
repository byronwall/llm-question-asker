import {
  createContext,
  useContext,
  type Accessor,
  type ParentProps,
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { revalidate } from "@solidjs/router";

import type { Job } from "~/lib/job-types";
import { isActiveStage, STALL_THRESHOLD_MS } from "~/lib/job-types";
import { getActiveJobs, cancelJob } from "~/server/job-actions";
import { toaster } from "~/components/ui/toast";

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

const POLL_INTERVAL_MS = 2000;

export function JobProvider(props: ParentProps) {
  console.log("JobProvider:init");

  const [jobs, setJobs] = createStore<Job[]>([]);
  const [isJobsPanelOpen, setJobsPanelOpen] = createSignal(false);
  const [watchedJobIds, setWatchedJobIds] = createSignal<Set<string>>(
    new Set()
  );

  const activeJobs = createMemo(() =>
    jobs.filter((j) => isActiveStage(j.stage))
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

  const fetchJobs = async () => {
    try {
      // Force cache invalidation first
      await revalidate(getActiveJobs.key);
      const activeJobsList = await getActiveJobs();
      console.log("JobProvider:fetchJobs", { count: activeJobsList.length });

      const prevJobs = [...jobs];

      // Clear and reset the jobs array to ensure reactivity
      if (activeJobsList.length === 0) {
        setJobs([]);
      } else {
        setJobs(reconcile(activeJobsList));
      }

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
          console.log("JobProvider:jobNoLongerActive", { jobId: prevJob.id });
          setWatchedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(prevJob.id);
            return next;
          });
        }
      }
    } catch (err) {
      console.error("JobProvider:fetchJobs:error", err);
    }
  };

  createEffect(() => {
    console.log("JobProvider:effect:polling", {
      hasActiveJobs: hasActiveJobs(),
    });
    fetchJobs();

    const interval = setInterval(() => {
      if (hasActiveJobs() || watchedJobIds().size > 0) {
        fetchJobs();
      }
    }, POLL_INTERVAL_MS);

    onCleanup(() => {
      console.log("JobProvider:effect:cleanup");
      clearInterval(interval);
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
    return jobs.find((j) => j.id === jobId);
  };

  const value = createMemo<JobController>(() => ({
    jobs: () => jobs,
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
