import {
  createContext,
  useContext,
  type Accessor,
  type JSX,
  createSignal,
  createMemo,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  createAsync,
  revalidate,
  useAction,
  useNavigate,
} from "@solidjs/router";

import type { Answer, Round, Session } from "~/lib/domain";
import type { Job } from "~/lib/job-types";
import {
  addMoreQuestions,
  createNextRound,
  createSession,
  deleteQuestion,
  getSession,
  submitAnswers,
} from "~/server/actions";
import { getJob } from "~/server/job-actions";
import { toaster } from "~/components/ui/toast";
import { JOB_TYPE_LABELS } from "~/lib/job-types";
import { useJobs } from "~/components/jobs/job-context";

export type ConsultationController = {
  prompt: Accessor<string>;
  setPrompt: (value: string) => void;
  answers: Answer[];
  isSubmitting: Accessor<boolean>;
  pendingJobId: Accessor<string | null>;
  sessionData: Accessor<Session | null | undefined>;
  currentRound: Accessor<Round | null>;
  isRoundComplete: Accessor<boolean>;
  handleCreateSession: () => Promise<void>;
  handleToggleOption: (questionId: string, optionId: string) => void;
  handleCustomInput: (questionId: string, value: string) => void;
  handleSubmitRound: () => Promise<void>;
  handleCreateNextRound: () => Promise<void>;
  handleAddMoreQuestions: () => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;
  setSessionId: (id: string) => void;
};

const Ctx = createContext<ConsultationController>();

type ConsultationProviderProps = {
  sessionId: string | undefined;
  setSessionId: (id: string) => void;
  children: JSX.Element;
};

const POLL_INTERVAL_MS = 1500;

export function ConsultationProvider(props: ConsultationProviderProps) {
  console.log("ConsultationProvider:init", {
    sessionId: props.sessionId,
    hasSessionId: !!props.sessionId,
  });

  const navigate = useNavigate();
  const jobsCtx = useJobs();

  const [prompt, setPrompt] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [answers, setAnswers] = createStore<Answer[]>([]);
  const [pendingJobId, setPendingJobId] = createSignal<string | null>(null);

  const sessionData = createAsync(() => {
    console.log("ConsultationProvider:createAsync:fetching", {
      sessionId: props.sessionId,
      willFetch: !!props.sessionId,
    });

    if (props.sessionId) {
      return getSession(props.sessionId).then((result) => {
        console.log("ConsultationProvider:createAsync:result", {
          sessionId: props.sessionId,
          hasResult: !!result,
        });
        return result;
      });
    }

    console.log(
      "ConsultationProvider:createAsync:noSessionId - returning null"
    );
    return Promise.resolve(null);
  });

  const runCreateSession = useAction(createSession);
  const runSubmitAnswers = useAction(submitAnswers);
  const runCreateNextRound = useAction(createNextRound);
  const runAddMoreQuestions = useAction(addMoreQuestions);
  const runDeleteQuestion = useAction(deleteQuestion);

  const currentRound = () => {
    const session = sessionData();
    if (!session || !session.rounds.length) return null;
    return session.rounds[session.rounds.length - 1];
  };

  const isRoundComplete = () => {
    const round = currentRound();
    if (!round) return false;
    return round.answers.length === round.questions.length;
  };

  const pollForJobCompletion = (
    jobId: string,
    onComplete: (job: Job) => void
  ) => {
    console.log("ConsultationProvider:pollForJobCompletion:start", { jobId });

    const poll = async () => {
      try {
        const job = await getJob(jobId);
        console.log("ConsultationProvider:pollForJobCompletion:poll", {
          jobId,
          stage: job?.stage,
        });

        if (!job) {
          console.error(
            "ConsultationProvider:pollForJobCompletion:jobNotFound"
          );
          setIsSubmitting(false);
          setPendingJobId(null);
          await jobsCtx.refreshJobs();
          return;
        }

        if (job.stage === "completed") {
          console.log("ConsultationProvider:pollForJobCompletion:completed", {
            jobId,
            resultSessionId: job.resultSessionId,
          });
          setIsSubmitting(false);
          setPendingJobId(null);
          await jobsCtx.refreshJobs();
          onComplete(job);
          return;
        }

        if (job.stage === "failed") {
          console.error("ConsultationProvider:pollForJobCompletion:failed", {
            jobId,
            error: job.error,
          });
          toaster.dismiss();
          toaster.create({
            title: "Operation failed",
            description: job.error ?? "An error occurred",
            type: "error",
            duration: 5000,
          });
          setIsSubmitting(false);
          setPendingJobId(null);
          await jobsCtx.refreshJobs();
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.error("ConsultationProvider:pollForJobCompletion:error", err);
        setIsSubmitting(false);
        setPendingJobId(null);
      }
    };

    poll();
  };

  const handleCreateSession = async () => {
    console.log("ConsultationProvider:handleCreateSession");
    const currentPrompt = prompt().trim();
    if (!currentPrompt) return;

    setIsSubmitting(true);
    try {
      const result = await runCreateSession(currentPrompt);
      console.log("ConsultationProvider:handleCreateSession:jobCreated", {
        jobId: result.jobId,
      });

      setPendingJobId(result.jobId);
      jobsCtx.addJobToWatch(result.jobId);

      pollForJobCompletion(result.jobId, (job) => {
        if (job.resultSessionId) {
          toaster.create({
            title: "Session ready!",
            description: "Your questions are ready to answer",
            type: "success",
            duration: 3000,
          });
          console.log(
            "ConsultationProvider:navigating to session",
            job.resultSessionId
          );
          navigate(`/session/${job.resultSessionId}`);
        }
      });
    } catch (error) {
      console.error("ConsultationProvider:handleCreateSession:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      toaster.create({
        title: "Failed to start",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleToggleOption = (questionId: string, optionId: string) => {
    console.log(
      "ConsultationProvider:handleToggleOption",
      questionId,
      optionId
    );

    const existing = answers.find((a) => a.questionId === questionId);
    if (!existing) {
      setAnswers([
        ...answers,
        { questionId, selectedOptionIds: [optionId], customInput: null },
      ]);
    } else {
      const isSelected = existing.selectedOptionIds.includes(optionId);
      const newOptions = isSelected
        ? existing.selectedOptionIds.filter((id) => id !== optionId)
        : [...existing.selectedOptionIds, optionId];

      setAnswers(
        (a) => a.questionId === questionId,
        "selectedOptionIds",
        newOptions
      );
    }
  };

  const handleCustomInput = (questionId: string, value: string) => {
    console.log("ConsultationProvider:handleCustomInput", questionId, value);

    const existing = answers.find((a) => a.questionId === questionId);
    if (!existing) {
      setAnswers([
        ...answers,
        { questionId, selectedOptionIds: [], customInput: value || null },
      ]);
    } else {
      setAnswers(
        (a) => a.questionId === questionId,
        "customInput",
        value || null
      );
    }
  };

  const handleSubmitRound = async () => {
    console.log("ConsultationProvider:handleSubmitRound");
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const result = await runSubmitAnswers({
        sessionId: session.id,
        answers: [...answers],
      });
      console.log("ConsultationProvider:handleSubmitRound:jobCreated", {
        jobId: result.jobId,
      });

      setPendingJobId(result.jobId);
      jobsCtx.addJobToWatch(result.jobId);

      pollForJobCompletion(result.jobId, () => {
        toaster.create({
          title: "Result ready!",
          description: "Your personalized recommendation is ready",
          type: "success",
          duration: 3000,
        });
        setAnswers([]);
        revalidate(getSession.key);
      });
    } catch (error) {
      console.error("ConsultationProvider:handleSubmitRound:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      toaster.create({
        title: "Failed to generate result",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleCreateNextRound = async () => {
    console.log("ConsultationProvider:handleCreateNextRound");
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const result = await runCreateNextRound(session.id);
      console.log("ConsultationProvider:handleCreateNextRound:jobCreated", {
        jobId: result.jobId,
      });

      setPendingJobId(result.jobId);
      jobsCtx.addJobToWatch(result.jobId);

      pollForJobCompletion(result.jobId, () => {
        toaster.create({
          title: "Next round ready!",
          description: "New questions have been generated",
          type: "success",
          duration: 3000,
        });
        revalidate(getSession.key);
      });
    } catch (error) {
      console.error("ConsultationProvider:handleCreateNextRound:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      toaster.create({
        title: "Failed to create next round",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleAddMoreQuestions = async () => {
    console.log("ConsultationProvider:handleAddMoreQuestions");
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const result = await runAddMoreQuestions({
        sessionId: session.id,
        answers: [...answers],
      });
      console.log("ConsultationProvider:handleAddMoreQuestions:jobCreated", {
        jobId: result.jobId,
      });

      setPendingJobId(result.jobId);
      jobsCtx.addJobToWatch(result.jobId);

      pollForJobCompletion(result.jobId, () => {
        toaster.create({
          title: "More questions added!",
          description: "Additional questions have been generated",
          type: "success",
          duration: 3000,
        });
        revalidate(getSession.key);
      });
    } catch (error) {
      console.error("ConsultationProvider:handleAddMoreQuestions:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      toaster.create({
        title: "Failed to add questions",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    console.log("ConsultationProvider:handleDeleteQuestion", questionId);
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runDeleteQuestion({ sessionId: session.id, questionId });
      setAnswers(answers.filter((a) => a.questionId !== questionId));
      revalidate(getSession.key);
    } catch (error) {
      console.error("ConsultationProvider:handleDeleteQuestion:error", error);
      toaster.create({
        title: "Failed to delete question",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = createMemo<ConsultationController>(() => ({
    prompt,
    setPrompt,
    answers,
    isSubmitting,
    pendingJobId,
    sessionData,
    currentRound,
    isRoundComplete,
    handleCreateSession,
    handleToggleOption,
    handleCustomInput,
    handleSubmitRound,
    handleCreateNextRound,
    handleAddMoreQuestions,
    handleDeleteQuestion,
    setSessionId: props.setSessionId,
  }));

  return <Ctx.Provider value={value()}>{props.children}</Ctx.Provider>;
}

export function useConsultation() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useConsultation must be used within a ConsultationProvider"
    );
  }
  return ctx;
}
