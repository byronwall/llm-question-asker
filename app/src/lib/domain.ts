export interface Session {
  id: string;
  prompt: string;
  questions: Question[];
  answers: Answer[];
  result: string | null;
  createdAt: string;
  updatedAt: string;
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
