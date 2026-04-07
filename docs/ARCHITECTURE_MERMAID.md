# Architecture diagrams (Mermaid)

PNG exports embedded in the main **[`README.md`](../README.md)** (system architecture section):

- [`docs/images/architecture-deployment.png`](images/architecture-deployment.png)
- [`docs/images/architecture-application.png`](images/architecture-application.png)

Below are **editable** sources. Render on GitHub or in VS Code with a Mermaid preview extension.

---

## 1. Deployment: Dev → GitHub → Netlify → Neon/Postgres

```mermaid
flowchart LR
  subgraph Dev
    Developer[Developer]
  end
  subgraph GitHubRepo
    GitHub[GitHub]
  end
  subgraph Netlify
    Build[Build]
    Runtime[Runtime]
    Build --> Runtime
  end
  subgraph DB
    Neon[(Neon/Postgres)]
  end

  Developer --> GitHub
  GitHub --> Build
  Runtime -->|DATABASE_URL, NEXTAUTH_*| Neon
```

---

## 2. Application: UI → Next.js routes → Data & external APIs

```mermaid
flowchart TB
  subgraph Frontend
    UI[User Interface]
    AuthUI[Auth]
    UI -->|Login / Register| AuthUI
  end

  subgraph Next["Next.js"]
    NextAuthR[NextAuth routes]
    PatientAPI[Patient API routes]
    Health[Health check]
    TransSum[Transcribe / Summarize]
    TranslateR[Translate routes]
  end

  subgraph Data
    PG[(PostgreSQL)]
    MEM[In-memory store]
  end

  subgraph External
    OAI[OpenAI]
    MM[MyMemory translation]
  end

  AuthUI -->|Authenticate| NextAuthR
  UI -->|Get/Create patients & intakes| PatientAPI
  UI -->|Send audio| TransSum
  UI -->|Translate text| TranslateR

  NextAuthR -->|Verify user| PG
  NextAuthR -->|Demo auth| MEM
  PatientAPI -->|CRUD & persist intakes| PG
  PatientAPI -->|Demo CRUD| MEM
  Health -->|Check DB| PG
  Health -->|Check demo| MEM

  TransSum -->|Transcribe / summarize| OAI
  OAI -->|Response| TransSum
  TranslateR -->|Translate| MM
  MM -->|Response| TranslateR
```

**Note:** In **demo mode**, auth and patient/intake traffic use the **in-memory** path; with **Postgres**, NextAuth and APIs use **PostgreSQL** (the diagram shows both targets for clarity).
