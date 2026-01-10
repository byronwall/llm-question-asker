import {
  createContext,
  useContext,
  type Accessor,
  type JSX,
  createSignal,
  createMemo,
} from "solid-js";
import { createStore, type Store } from "solid-js/store";
import { createAsync, useAction } from "@solidjs/router";
import type { Answer, Round, Session } from "~/lib/domain";
import {
  addMoreQuestions,
  createNextRound,
  createSession,
  deleteQuestion,
  getSession,
  submitAnswers,
} from "~/server/actions";

export type ConsultationController = {
  // State
  prompt: Accessor<string>;
  setPrompt: (value: string) => void;
  answers: Store<Answer[]>;
  isSubmitting: Accessor<boolean>;

  // Session data
  sessionData: Accessor<Session | null | undefined>;
  currentRound: Accessor<Round | null>;
  isRoundComplete: Accessor<boolean>;

  // Actions
  handleCreateSession: () => Promise<void>;
  handleToggleOption: (questionId: string, optionId: string) => void;
  handleCustomInput: (questionId: string, value: string) => void;
  handleSubmitRound: () => Promise<void>;
  handleCreateNextRound: () => Promise<void>;
  handleAddMoreQuestions: () => Promise<void>;
  handleDeleteQuestion: (questionId: string) => Promise<void>;

  // URL params
  setSessionId: (id: string) => void;
};

const Ctx = createContext<ConsultationController>();

type ConsultationProviderProps = {
  sessionId: string | undefined;
  setSessionId: (id: string) => void;
  children: JSX.Element;
};

export function ConsultationProvider(props: ConsultationProviderProps) {
  console.log("ConsultationProvider:init", {
    sessionId: props.sessionId,
    hasSessionId: !!props.sessionId,
  });

  const [prompt, setPrompt] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [answers, setAnswers] = createStore<Answer[]>([]);

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
          result,
        });
        return result;
      });
    }

    console.log("ConsultationProvider:createAsync:noSessionId - returning null");
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

  const handleCreateSession = async () => {
    console.log("ConsultationProvider:handleCreateSession");
    const currentPrompt = prompt().trim();
    if (!currentPrompt) return;

    setIsSubmitting(true);
    try {
      const session = await runCreateSession(currentPrompt);
      props.setSessionId(session.id);
    } catch (error) {
      console.error("ConsultationProvider:handleCreateSession:error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOption = (questionId: string, optionId: string) => {
    console.log("ConsultationProvider:handleToggleOption", questionId, optionId);

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
      await runSubmitAnswers({ sessionId: session.id, answers: [...answers] });
      setAnswers([]); // Reset for next round if any
    } catch (error) {
      console.error("ConsultationProvider:handleSubmitRound:error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNextRound = async () => {
    console.log("ConsultationProvider:handleCreateNextRound");
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runCreateNextRound(session.id);
    } catch (error) {
      console.error("ConsultationProvider:handleCreateNextRound:error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMoreQuestions = async () => {
    console.log("ConsultationProvider:handleAddMoreQuestions");
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runAddMoreQuestions({ sessionId: session.id, answers: [...answers] });
      // Don't reset answers - user may continue answering the new questions
    } catch (error) {
      console.error("ConsultationProvider:handleAddMoreQuestions:error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    console.log("ConsultationProvider:handleDeleteQuestion", questionId);
    const session = sessionData();
    if (!session) return;

    setIsSubmitting(true);
    try {
      await runDeleteQuestion({ sessionId: session.id, questionId });
      // Also remove the answer from local state
      setAnswers(answers.filter((a) => a.questionId !== questionId));
    } catch (error) {
      console.error("ConsultationProvider:handleDeleteQuestion:error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = createMemo<ConsultationController>(() => ({
    prompt,
    setPrompt,
    answers,
    isSubmitting,
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
