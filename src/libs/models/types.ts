export type ModelCallOptions = {
  prompt?: string;
  dataUrl?: string;
  modelName?: string;
  modelOrigin?: string;
  tools?: any[];
  input?: any[];
  instructions?: string
}

export type ModelResponseOutputContent = {
  annotations: any[]
  logprobs: any[]
  text: string
  type: string // 'output_text'
}

export type ModelResponseOutput = {
  call_id: any;
  arguments: string;
  name: string;
  id: string
  type: string // 'message'
  role: string // 'assistant'
  status: string // 'completed'
  content: ModelResponseOutputContent[]
}

export type ModelResponse = {
  id: any;
  // ...bunch of props
  object: string
  status: string
  model: string
  output: ModelResponseOutput[]
}