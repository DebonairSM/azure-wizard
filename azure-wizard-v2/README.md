# Azure Wizard V2

A simplified TypeScript Node.js application for discovering Azure configuration information and products through an interactive tree-based interface.

## Features

- **Tree-based Navigation**: Drill down into Azure services and configurations using an intuitive tree interface
- **Modular Wizard System**: Easily add new wizards for different Azure services
- **SQLite Database**: Simple, file-based database with relationships for detailed configurations
- **No Caching**: All data fetched on-demand from the API for simplicity
- **TypeScript**: Full TypeScript implementation for type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Navigate to the project directory:
```bash
cd azure-wizard-v2
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

5. Open your browser to `http://localhost:3030`

## Project Structure

```
azure-wizard-v2/
├── src/
│   ├── server/           # Express server and routes
│   ├── database/         # SQLite database setup and schema
│   ├── wizards/          # Wizard implementations
│   │   ├── base/         # Base wizard interface and registry
│   │   ├── azure-services/  # Azure Services wizard
│   │   └── apim/         # API Management wizard
│   ├── shared/           # Shared models and types
│   └── client/            # Client-side application
├── data/                 # SQLite database files
└── dist/                 # Compiled JavaScript (generated)
```

## Adding a New Wizard

To add a new wizard, follow these steps:

### 1. Create Wizard Directory

Create a new directory in `src/wizards/` for your wizard:

```
src/wizards/my-wizard/
├── MyWizard.ts
└── my-wizard-schema.sql  (optional)
```

### 2. Implement the Wizard Class

Create a class that implements the `IWizard` interface:

```typescript
import { IWizard } from '../base/IWizard.js';
import { Node } from '../../shared/models/Node.js';
import { getDatabase } from '../../database/db.js';

export class MyWizard implements IWizard {
  id = 'my-wizard';
  name = 'My Wizard';
  description = 'Description of what this wizard does';

  // Optional: Define additional database schema
  getSchemaAdditions?(): string {
    // Return SQL schema additions if needed
    return `CREATE TABLE IF NOT EXISTS my_table (...);`;
  }

  async getRootNodes(): Promise<Node[]> {
    // Return the root nodes for your wizard
    const db = getDatabase();
    // Query and return nodes
    return [];
  }

  async getNodeChildren(nodeId: string): Promise<Node[]> {
    // Return child nodes for a given node
    return [];
  }

  async getNodeData(nodeId: string): Promise<any> {
    // Return detailed data for a node
    return null;
  }

  async loadData(): Promise<void> {
    // Load initial data into the database
    const db = getDatabase();
    // Insert data
  }
}
```

### 3. Register the Wizard

In `src/server/index.ts`, import and register your wizard:

```typescript
import { MyWizard } from '../wizards/my-wizard/MyWizard.js';

// Register wizards
const myWizard = new MyWizard();
wizardRegistry.register(myWizard);

// Load wizard data
(async () => {
  try {
    await myWizard.loadData();
  } catch (error) {
    console.error('Error loading wizard data:', error);
  }
})();
```

### 4. Database Schema

If your wizard needs additional tables, create a schema file and return it from `getSchemaAdditions()`. The schema will be automatically applied when the wizard is registered.

### 5. Node Structure

Nodes are stored in the `nodes` table and linked to wizards via `wizard_id`. Each node can have:
- `id`: Unique identifier
- `wizard_id`: Links to the wizard
- `parent_id`: For tree hierarchy (null for root nodes)
- `name`: Display name
- `description`: Optional description
- `node_type`: Type of node (e.g., 'category', 'service', 'sku', 'attribute')
- `data`: JSON field for wizard-specific data

## API Endpoints

### Wizards

- `GET /api/wizards` - List all available wizards
- `GET /api/wizards/:id/nodes` - Get root nodes for a wizard
- `GET /api/wizards/:id/nodes/:nodeId` - Get specific node details
- `GET /api/wizards/:id/nodes/:nodeId/children` - Get child nodes

### Azure Services (Shared)

- `GET /api/azure-services` - List all Azure services
- `GET /api/azure-services/:id` - Get specific Azure service with attributes

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run build:watch
```

### Server Port

Set the `PORT` environment variable to change the server port (default: 3030):

```bash
PORT=3031 npm start
```

## Database

The application uses SQLite with the database file stored in `data/wizard.db`. The schema is automatically initialized on first run.

### Core Tables

- `wizards` - Wizard definitions
- `nodes` - Tree nodes (shared across all wizards)
- `azure_services` - Shared Azure service information
- `azure_service_attributes` - Detailed attributes for services

Each wizard can add its own tables via the `getSchemaAdditions()` method.

## Architecture

### Wizard System

Wizards are self-contained modules that:
1. Implement the `IWizard` interface
2. Define their own data structure
3. Provide tree navigation logic
4. Load their own data

### Client Application

The client is a vanilla TypeScript application that:
- Fetches data from the API on demand
- Renders a tree view for navigation
- Displays node details in the main area
- Shows breadcrumb navigation

### No Caching

Unlike the original application, this version does not use client-side caching. All data is fetched from the API when needed, simplifying the architecture.

## License

ISC





