export interface Session {
  id: string;
  prompt: string;
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  questions: Question[];
  answers: Answer[];
  result: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
}

export interface Answer {
  questionId: string;
  selectedOptionIds: string[];
  customInput: string | null;
}
