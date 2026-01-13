import {
  createContext,
  useContext,
  type Accessor,
  type JSX,
  createSignal,
  createMemo,
  batch,
  createEffect,
} from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import { createAsync, revalidate, useAction } from "@solidjs/router";

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
import { toaster } from "~/components/ui/toast";
import { useJobs } from "~/components/jobs/job-context";

export type ConsultationController = {
  prompt: Accessor<string>;
  setPrompt: (value: string) => void;
  answers: Answer[];
  refineGuidance: Accessor<string>;
  setRefineGuidance: (value: string) => void;
  isSubmitting: Accessor<boolean>;
  pendingJobId: Accessor<string | null>;
  sessionData: Accessor<Session | null | undefined>;
  currentRound: Accessor<Round | null>;
  isRoundComplete: Accessor<boolean>;
  handleCreateSession: () => Promise<void>;
  handleCreateSessionFromPrompt: (value: string) => Promise<void>;
  handleToggleOption: (questionId: string, optionId: string) => void;
  handleCustomInput: (questionId: string, value: string) => void;
  handleSubmitRound: () => Promise<void>;
  handleCreateNextRound: () => Promise<void>;
  handleAddMoreQuestions: () => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;
  setSessionId: (id: string) => void;
  focusDialogState: FocusDialogState;
  setFocusDialogState: SetStoreFunction<FocusDialogState>;
};

const Ctx = createContext<ConsultationController>();

type ConsultationProviderProps = {
  sessionId: string | undefined;
  setSessionId: (id: string) => void;
  children: JSX.Element;
};

type FocusDialogState = {
  isOpen: boolean;
  focusInput: string;
  generatedPrompt: string | null;
  generationError: string | null;
  isGenerating: boolean;
  closeIntent: boolean;
};

export function ConsultationProvider(props: ConsultationProviderProps) {
  console.log("ConsultationProvider:init", {
    sessionId: props.sessionId,
    hasSessionId: !!props.sessionId,
  });

  const jobsCtx = useJobs();

  const [prompt, setPrompt] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [answers, setAnswers] = createStore<Answer[]>([]);
  const [refineGuidance, setRefineGuidance] = createSignal("");
  const [pendingJobId, setPendingJobId] = createSignal<string | null>(null);
  const [pendingJobHandler, setPendingJobHandler] = createSignal<
    ((job: Job) => void) | null
  >(null);
  const [lastSessionJobIds, setLastSessionJobIds] = createSignal<string[]>([]);
  const [focusDialogState, setFocusDialogState] = createStore<FocusDialogState>(
    {
      isOpen: false,
      focusInput: "",
      generatedPrompt: null,
      generationError: null,
      isGenerating: false,
      closeIntent: false,
    }
  );

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

  const sessionActiveJobs = createMemo(() => {
    if (!props.sessionId) return [];
    return jobsCtx.jobs().filter((job) => job.sessionId === props.sessionId);
  });
  const hasSessionActiveJobs = () => sessionActiveJobs().length > 0;

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

  const startJobTracking = (jobId: string, onComplete: (job: Job) => void) => {
    console.log("ConsultationProvider:jobTracking:start", { jobId });
    setPendingJobId(jobId);
    setPendingJobHandler(() => onComplete);
  };

  const startCreateSession = async (nextPrompt: string) => {
    const currentPrompt = nextPrompt.trim();
    if (!currentPrompt) return;

    batch(() => {
      setPrompt(currentPrompt);
      setFocusDialogState("closeIntent", false);
    });
    setIsSubmitting(true);
    try {
      const result = await runCreateSession(currentPrompt);
      console.log("ConsultationProvider:handleCreateSession:jobCreated", {
        jobId: result.jobId,
      });

      jobsCtx.addJobToWatch(result.jobId);
      props.setSessionId(result.sessionId);

      startJobTracking(result.jobId, (job) => {
        if (job.resultSessionId) {
          toaster.create({
            title: "Session ready!",
            description: "Your questions are ready to answer",
            type: "success",
            duration: 3000,
          });
          console.log("ConsultationProvider:sessionReady", {
            sessionId: job.resultSessionId,
          });
          revalidate(getSession.key);
        }
      });
    } catch (error) {
      console.error("ConsultationProvider:handleCreateSession:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      setPendingJobHandler(null);
      toaster.create({
        title: "Failed to start",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleCreateSession = async () => {
    console.log("ConsultationProvider:handleCreateSession");
    await startCreateSession(prompt());
  };

  const handleCreateSessionFromPrompt = async (value: string) => {
    console.log("ConsultationProvider:handleCreateSessionFromPrompt");
    await startCreateSession(value);
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

      jobsCtx.addJobToWatch(result.jobId);

      startJobTracking(result.jobId, () => {
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
      setPendingJobHandler(null);
      toaster.create({
        title: "Failed to generate result",
        description: String(error),
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleCreateNextRound = async () => {
    const guidance = refineGuidance().trim();
    console.log("ConsultationProvider:handleCreateNextRound", {
      hasGuidance: guidance.length > 0,
      guidanceLength: guidance.length,
    });
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const result = await runCreateNextRound({
        sessionId: session.id,
        guidance: guidance || undefined,
      });
      console.log("ConsultationProvider:handleCreateNextRound:jobCreated", {
        jobId: result.jobId,
      });

      jobsCtx.addJobToWatch(result.jobId);
      revalidate(getSession.key);

      startJobTracking(result.jobId, () => {
        toaster.create({
          title: "Next round ready!",
          description: "New questions have been generated",
          type: "success",
          duration: 3000,
        });
        setRefineGuidance("");
        revalidate(getSession.key);
      });
    } catch (error) {
      console.error("ConsultationProvider:handleCreateNextRound:error", error);
      setIsSubmitting(false);
      setPendingJobId(null);
      setPendingJobHandler(null);
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

      jobsCtx.addJobToWatch(result.jobId);

      startJobTracking(result.jobId, () => {
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
      setPendingJobHandler(null);
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
    refineGuidance,
    setRefineGuidance,
    isSubmitting,
    pendingJobId,
    sessionData,
    currentRound,
    isRoundComplete,
    handleCreateSession,
    handleCreateSessionFromPrompt,
    handleToggleOption,
    handleCustomInput,
    handleSubmitRound,
    handleCreateNextRound,
    handleAddMoreQuestions,
    handleDeleteQuestion,
    setSessionId: props.setSessionId,
    focusDialogState,
    setFocusDialogState,
  }));

  createEffect(() => {
    const jobId = pendingJobId();
    if (!jobId) return;
    const job = jobsCtx.getJobById(jobId);
    if (!job) return;

    console.log("ConsultationProvider:jobUpdate", {
      jobId,
      stage: job.stage,
    });

    if (job.stage === "completed") {
      console.log("ConsultationProvider:jobCompleted", {
        jobId,
        resultSessionId: job.resultSessionId,
      });
      const handler = pendingJobHandler();
      setIsSubmitting(false);
      setPendingJobId(null);
      setPendingJobHandler(null);
      handler?.(job);
      return;
    }

    if (job.stage === "failed") {
      console.error("ConsultationProvider:jobFailed", {
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
      setPendingJobHandler(null);
    }
  });

  createEffect(() => {
    const hasActive = hasSessionActiveJobs();
    console.log("ConsultationProvider:sessionJobs:check", {
      sessionId: props.sessionId,
      activeCount: sessionActiveJobs().length,
    });
    if (!hasActive) return;
    console.log("ConsultationProvider:sessionJobs:revalidate", {
      sessionId: props.sessionId,
    });
    revalidate(getSession.key);
  });

  createEffect(() => {
    if (!props.sessionId) return;
    const activeJobs = sessionActiveJobs();
    const nextIds = activeJobs.map((job) => job.id);
    const prevIds = lastSessionJobIds();
    const hasChanges =
      nextIds.length !== prevIds.length ||
      nextIds.some((id, index) => id !== prevIds[index]);
    if (!hasChanges) return;
    const removedIds = prevIds.filter((id) => !nextIds.includes(id));
    if (removedIds.length > 0) {
      console.log("ConsultationProvider:sessionJobs:completed", {
        sessionId: props.sessionId,
        removedIds,
      });
      revalidate(getSession.key);
    }
    setLastSessionJobIds(nextIds);
  });

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
