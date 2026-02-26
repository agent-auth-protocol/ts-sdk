# @agent-auth-protocol/ts-sdk 🛡️

**The official TypeScript verifier for the AgentAuth M2M Protocol.**

Designed for edge networks (Cloudflare Workers, Vercel Edge) and Node.js environments. This SDK allows your API gateways and infrastructure to cryptographically verify short-lived agent JWTs in just two lines of code, preventing unauthorized LLMs from accessing your data.

## Flow

```mermaid
sequenceDiagram
    participant Agent as AI Agent (Python SDK)
    participant Core as Auth Server (Go Core)
    participant API as API Gateway (TS SDK)

    Note over Agent, Core: Phase 1: Identity Minting
    Agent->>Core: POST /register (Sends Ed25519 Public Key)
    Core-->>Agent: 201 Created (Agent Registered)

    Agent->>Core: POST /token (Header: X-Agent-ID)
    Core-->>Agent: Returns Signed JWT (5-min expiry)

    Note over Agent: SDK Caches JWT locally<br/>to prevent spamming Auth Server

    Note over Agent, API: Phase 2: Infrastructure Access
    Agent->>API: GET /protected-data (Header: Bearer <JWT>)

    Note over API: TS SDK mathematically verifies<br/>EdDSA signature offline using<br/>Core's Public Key.

    alt Token Valid & Not Expired
        API-->>Agent: 200 OK (Access Granted, Returns Data)
    else Token Forged or Expired
        API-->>Agent: 401 Unauthorized (Access Denied)
    end
```

## 📦 Installation

```bash
npm install @agent-auth-protocol/ts-sdk jose
```

## 🚀 Quick Start

```typescript
import { AgentAuthVerifier } from '@agent-auth-protocol/ts-sdk'

// 1. Initialize with your Auth Server's public key (Ed25519)
const verifier = new AgentAuthVerifier(process.env.AGENT_AUTH_PUBLIC_KEY)

// 2. Verify incoming tokens in your API middleware
async function handleAgentRequest(req) {
  const token = req.headers.authorization?.split(' ')[1]

  try {
    const { isValid, agentId } = await verifier.verifyToken(token)
    console.log(`Access granted to agent: ${agentId}`)
    // Proceed with infrastructure execution...
  } catch (error) {
    console.error('Agent verification failed:', error.message)
    // Block access (e.g., return 401 Unauthorized)
  }
}
```

---

_Built for the Agentic Era. Part of the AgentAuth Protocol Suite._
