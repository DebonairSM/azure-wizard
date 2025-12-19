# Azure Recipe Wizard

A decision tree wizard for Azure architecture guidance, AZ-204 exam study, and solution design.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Running

```bash
npm start
```

Open `http://localhost:3030`

### Running V1 (legacy)

If you specifically need the legacy v1 server:

```bash
npm run start:v1
```

By default, v1 runs on `http://localhost:3031` to avoid conflicting with v2.

### OpenAI API Key (Optional)

For AI-powered research features, create a `.env` file:

```
OPENAI_API_KEY=sk-your-key-here
```

## Features

- **Decision Tree**: Interactive wizard where each choice determines available next options
- **Study Mode**: Focus on exam objectives, pros/cons, and learning materials
- **Design Mode**: Focus on implementation details and IaC hints
- **Azure Resource Discovery**: Auto-discover Azure service SKUs and pricing
- **AI Improve**: Enrich nodes with new Azure services via OpenAI

## Architecture

- **V2 (default)**: `azure-wizard-v2/` (TypeScript, tree-based wizard, SQLite at `azure-wizard-v2/data/wizard.db`)
- **V1 (legacy)**: root app (Express + EJS, SQLite at `data/wizard.db`)

## Scripts

```bash
npm run migrate              # Migrate JSON seed data to SQLite
npm run populate-apim        # Populate APIM offerings data
npm run discover-azure-resources  # Discover Azure service SKUs
```

See `scripts/README.md` for detailed script documentation.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nodes` | List all nodes |
| GET | `/api/nodes/:id` | Get node by ID |
| POST | `/api/nodes` | Create node |
| GET | `/api/options/:nodeId` | Get options for node |
| POST | `/api/options` | Create option |
| GET | `/api/paths` | Get all paths |
| POST | `/api/paths` | Create path |
| GET | `/api/recipes/:nodeId` | Get recipe |
| POST | `/api/recipes` | Create/update recipe |
| GET | `/api/apim-offerings` | List APIM offerings |
