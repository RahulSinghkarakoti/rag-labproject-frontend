export type RunStep = {
  id: string;
  run_id: string;
  step_type: string;
  sequence: number;
  status: string;
  input?: any;
  output?: any;
  config?: any;
  error?: any;
  started_at?: string | null;
  completed_at?: string | null;
  metadata?: any;
};

export type RunDetails = {
  id: string;
  thread_id: string;
  input_message_id?: string | null;
  output_message_id?: string | null;
  run_type: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  error?: Record<string, any> | null;
  steps: RunStep[];
};
