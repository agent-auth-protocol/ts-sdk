export class AgentAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentAuthError'
  }
}
