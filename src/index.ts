import * as jose from 'jose'
import { AgentAuthError } from './errors'

export { AgentAuthError }

export interface VerificationResult {
  isValid: boolean
  agentId?: string
  expiresAt?: Date
}

/**
 * AgentAuthVerifier ensures that Machine-to-Machine (M2M)
 * JWTs issued by the AgentAuth core protocol are cryptographically valid.
 */
export class AgentAuthVerifier {
  private publicKey: Uint8Array

  /**
   * Initialize the verifier with the Ed25519 public key from the Auth Server.
   * @param publicKeyHex The hex-encoded Ed25519 public key.
   */
  constructor(publicKeyHex: string) {
    if (!publicKeyHex || publicKeyHex.length !== 64) {
      throw new AgentAuthError('Invalid public key format. Expected 64-character hex string.')
    }
    this.publicKey = new Uint8Array(Buffer.from(publicKeyHex, 'hex'))
  }

  /**
   * Verifies an AgentAuth JWT.
   * @param token The JWT string provided by the AI agent.
   * @returns VerificationResult containing the agent's ID and token expiration.
   */
  public async verifyToken(token: string): Promise<VerificationResult> {
    try {
      // Verify the EdDSA signature and check expiration (exp) automatically
      const { payload } = await jose.jwtVerify(token, this.publicKey, {
        algorithms: ['EdDSA'],
        audience: 'agent-infrastructure',
      })

      return {
        isValid: true,
        agentId: payload.sub,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      }
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new AgentAuthError('Agent token has expired. Request a new ephemeral token.')
      }
      if (error instanceof jose.errors.JWSInvalid) {
        throw new AgentAuthError('Cryptographic signature verification failed.')
      }
      throw new AgentAuthError(`Token verification failed: ${(error as Error).message}`)
    }
  }
}
