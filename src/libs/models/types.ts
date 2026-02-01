export type ModelCallOptions = {
  prompt?: string;
  dataUrl?: string;
  modelName?: string;
  modelOrigin?: string;
  tools?: any[];
  input?: any[];
  instructions?: string
  integrations?: any[] // {type:plugin, id: string}
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

/* v1Chat types */
export type ChatResponseToolCallOutput = {
  type: 'tool_call'
  tool: string;
  arguments: any
  output: any
  provider_info: any
}

export type ChatResponseTextOutput = {
  type: 'message'
  content: string;
}

export type ChatModelResponse = {
  model_instance_id: string;
  output: (ChatResponseTextOutput | ChatResponseToolCallOutput)[]
  response_id: string
  stats: any
}