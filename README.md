# AutoDM Services (`autodm-services`)

Business logic, database models, and Lambda handlers for AutoDM.

## Tech Stack
* **Database:** Neon Serverless PostgreSQL with Drizzle ORM (`@neondatabase/serverless` HTTP driver)
* **Validation:** Zod schemas
* **Build Tool:** `esbuild` for tree-shaken, single-file bundles per Lambda handler
* **Queuing:** AWS SQS client for asynchronous DM processing

## Project Structure
```text
src/
├── handlers/         # 1 file per Lambda handler (entry point only)
│   ├── automations/  # CRUD API handlers
│   ├── webhooks/     # Meta webhook verify & ingest
│   ├── workers/      # SQS comment processor
│   ├── instagram/    # OAuth handlers
│   └── auth/         # Session handlers
├── core/             # Pure business logic (no HTTP/AWS dependencies)
│   ├── automations/
│   ├── webhooks/
│   └── instagram/
├── infra/            # External services & adapters
│   ├── database/     # Drizzle client & schema (Neon HTTP)
│   ├── sqs/          # AWS SQS client
│   └── instagram/    # Meta Graph API client
└── shared/           # Zod schemas, errors, response utils, logger
```

## Commands
* `pnpm run build`: Bundles each handler with `esbuild` and generates standalone zips in `zips/`.
* `pnpm run db:generate`: Generates Drizzle migrations for Neon DB.
* `pnpm run db:migrate`: Applies migrations directly to your Neon DB.
