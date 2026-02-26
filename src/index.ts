import { importJWK, jwtVerify, JWTPayload } from 'jose'
import { ConfigurationError, TokenValidationError } from './errors'

export interface VerificationResult {
  isValid: boolean
  agentId: string
  payload: JWTPayload
}

export class AgentAuthVerifier {
  private publicKeyHex: string

  constructor(publicKeyHex: string | undefined) {
    if (!publicKeyHex) {
      throw new ConfigurationError('Public key is required to initialize the verifier.')
    }

    // Strip prefix if the user accidentally included '0x'
    const cleanHex = publicKeyHex.replace(/^0x/, '').toLowerCase()

    if (!/^[0-9a-f]{64}$/.test(cleanHex)) {
      throw new ConfigurationError('Invalid public key format. Expected a 64-character hex string.')
    }

    this.publicKeyHex = cleanHex
  }

  // Internal helper to convert raw hex to the Base64URL format required by JWK
  private hexToBase64Url(hex: string): string {
    return Buffer.from(hex, 'hex').toString('base64url')
  }

  public async verifyToken(token: string): Promise<VerificationResult> {
    if (!token) {
      throw new TokenValidationError('No token provided')
    }

    try {
      // 1. Convert the raw hex key into a universal JSON Web Key internally
      const jwk = {
        kty: 'OKP',
        crv: 'Ed25519',
        x: this.hexToBase64Url(this.publicKeyHex),
      }

      // 2. Import the key and verify the token
      const publicKey = await importJWK(jwk, 'EdDSA')
      const { payload } = await jwtVerify(token, publicKey)

      if (!payload.sub) {
        throw new TokenValidationError("Token is missing 'sub' (agentId) claim")
      }

      return {
        isValid: true,
        agentId: payload.sub,
        payload,
      }
    } catch (error: any) {
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new TokenValidationError('Token has expired')
      }
      throw new TokenValidationError(`Token verification failed: ${error.message}`)
    }
  }
}
