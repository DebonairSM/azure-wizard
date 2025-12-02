# Azure Recipe Wizard

A Node.js server-based decision tree wizard for Azure architecture guidance, AZ-204 exam study, and solution design.

## Features

- **Decision Tree Navigation**: Interactive wizard where each choice determines available next options
- **Study Mode**: Focus on exam objectives, pros/cons, and learning materials
- **Design Mode**: Focus on implementation details, IaC hints, and resource lists
- **Search**: Jump to specific nodes by text or tag
- **Path Explanation**: Understand why your choices led to a particular recipe
- **Export**: Save your decision path and recipe as JSON
- **Version Control**: SQLite database as source of truth with automatic versioning

## Architecture

- **Storage**: SQLite database (`data/wizard.db`) as source of truth
- **Server**: Node.js Express server with server-side rendering (EJS)
- **API**: RESTful API endpoints for data access
- **Client**: Browser app with IndexedDB cache for offline support
- **Data Management**: CLI tools for adding nodes, options, paths, and recipes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Migrate existing JSON data to SQLite (first time only):
```bash
npm run migrate
```

This will read `data/seed-data.json` and create `data/wizard.db`.

### Running the Application

Start the Node.js server:
```bash
npm start
```

This will start the Express server on port 3030. Open your browser to `http://localhost:3030`.

### API Key Configuration

The application needs an OpenAI API key for research features. The key is automatically loaded from your `.env` file when using `npm start`:

1. Create a `.env` file in the project root with:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
2. When you run `npm start`, the key will be automatically loaded from `.env` and configured for browser use.
3. Alternatively, you can set the key via the "API Key" button in the UI, which stores it in your browser's localStorage.

**Note:** The `.env` file is git-ignored for security. Never commit your API key.

### Using the Wizard

1. The wizard loads data from the SQLite database
2. Server-side rendering provides initial data
3. Client-side IndexedDB cache supports offline functionality
4. Data version is tracked in the database

## File Structure

```
azure-wizard/
├── server.js               # Main Express server
├── db/
│   ├── schema.sql          # Database schema
│   └── database.js         # Database connection and initialization
├── routes/
│   ├── wizard.js            # Wizard routes (server-side rendering)
│   └── api.js              # API endpoints
├── views/
│   └── index.ejs            # Server-side template
├── scripts/
│   ├── migrate-json-to-sqlite.js  # Migration script
│   ├── add-node.js         # CLI: Add node
│   ├── add-option.js        # CLI: Add option
│   ├── add-path.js          # CLI: Add path
│   └── export-json.js       # CLI: Export to JSON
├── js/
│   ├── storage.js           # IndexedDB operations (client cache)
│   ├── data-provider.js     # Data provider abstraction
│   ├── data-loader.js       # Data loading from API
│   ├── api-client.js        # API client functions
│   ├── wizard-engine.js     # Decision tree traversal logic
│   ├── wizard.js            # Main UI controller
│   └── ui.js                # UI rendering functions
├── data/
│   ├── wizard.db            # SQLite database (source of truth)
│   └── seed-data.json       # Original JSON (backup/import)
└── README.md
```

## Data Model

### Nodes
Decision points in the wizard with:
- Question and description
- Tags for categorization
- AZ-204 exam objectives mapping
- Role focus areas

### Options
Choices available at each node with:
- Label and description
- Pros and cons
- When to use / when not to use guidance

### Paths
Transitions between nodes based on user choices

### Recipes
Final configuration guides with:
- Step-by-step instructions
- Infrastructure hints (Bicep/Terraform)
- Links to official documentation
- Skill level indicators

## Updating Data

### Using CLI Tools

Add a new node:
```bash
node scripts/add-node.js
```

Add a new option:
```bash
node scripts/add-option.js
```

Add a new path (connection):
```bash
node scripts/add-path.js
```

### Using the API

The server provides REST API endpoints for programmatic access:
- `GET /api/nodes` - List all nodes
- `GET /api/nodes/:id` - Get node by ID
- `POST /api/nodes` - Create node
- `GET /api/options/:nodeId` - Get options for node
- `POST /api/options` - Create option
- `GET /api/paths` - Get paths
- `POST /api/paths` - Create path
- `GET /api/recipes/:nodeId` - Get recipe
- `POST /api/recipes` - Create/update recipe

### Export/Import

Export database to JSON (for backup):
```bash
node scripts/export-json.js
```

Import JSON to database:
```bash
npm run migrate
```

### Schema Migration

Migrate APIM offerings to the new extensible `azureOfferings` table:

```bash
npm run migrate-apim-to-azure
```

This migrates data from the service-specific `apimOfferings` table to the generic `azureOfferings` table, which supports all Azure services with a flexible JSON-based schema. See `SCHEMA_EXTENSIBILITY.md` for details.

Query the new schema:
```bash
npm run query-azure-offerings
```

## Development

The codebase uses:
- ES modules for clean imports/exports
- JSDoc comments for type hints
- AI-friendly comments for future refactoring guidance

## Future Enhancements

- Provisioning hooks for Bicep/Terraform template generation
- Additional study materials and practice questions
- More decision paths and recipes
- Visual diagram generation

