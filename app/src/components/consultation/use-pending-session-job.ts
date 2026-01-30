import type { Job } from "~/lib/job-types";
import { useJobs } from "~/components/jobs/job-context";
import { useConsultation } from "./consultation-context";

type PendingSessionJobState = {
  pendingJob: () => Job | null;
  isGeneratingResult: () => boolean;
  isAddingQuestions: () => boolean;
  isCreatingNextRound: () => boolean;
};

export function usePendingSessionJob(): PendingSessionJobState {
  const ctx = useConsultation();
  const jobsCtx = useJobs();

  const pendingJob = () => {
    const jobId = ctx.pendingJobId();
    if (jobId) {
      return jobsCtx.getJobById(jobId) ?? null;
    }
    const session = ctx.sessionData();
    if (!session) return null;
    return jobsCtx.jobs().find((job) => job.sessionId === session.id) ?? null;
  };

  const isGeneratingResult = () => pendingJob()?.type === "submit_answers";
  const isAddingQuestions = () => pendingJob()?.type === "add_more_questions";
  const isCreatingNextRound = () => pendingJob()?.type === "create_next_round";

  return {
    pendingJob,
    isGeneratingResult,
    isAddingQuestions,
    isCreatingNextRound,
  };
}
