export class AgentAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentAuthError'
  }
}

export class ConfigurationError extends AgentAuthError {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class TokenValidationError extends AgentAuthError {
  constructor(message: string) {
    super(message)
    this.name = 'TokenValidationError'
  }
}
