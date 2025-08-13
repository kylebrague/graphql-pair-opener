# Pair Opener

A VS Code extension that streamlines GraphQL development by providing quick access to related resolver and type definition files.

At the most basic level, this just looks for files with the same base name (excluding extensions) in the configured resolver and type definition directories. Whether or not they are related to GraphQL is irrelevant.

## Quick Start

```bash
git clone https://github.com/kylebrague/graphql-pair-opener.git
cd graphql-pair-opener
npm install # or just make sure you have VS Code Extension Manager (https://github.com/microsoft/vscode-vsce) installed
npm run build:install
```
Reload your window and that's it.

## Features

This extension adds convenient context menu commands to quickly navigate between GraphQL resolvers and type definitions that share the same base filename.

### Two Main Commands:

1. **Open Corresponding TypeDef/Resolver File** - Opens the matching file (resolver ↔ typedef)
2. **Open Both TypeDef and Resolver Files** - Opens both related files simultaneously

### Key Benefits:

- **Quick Navigation**: Right-click any resolver or typedef file to instantly open its counterpart
- **Flexible File Extensions**: Works with any file extension (`.ts`, `.js`, `.graphql`, etc.)
- **Smart Context Awareness**: Commands only appear for files in your configured directories
- **Customizable Layout**: Choose between split-view or new tabs
- **Preview Mode Support**: Optionally open files in preview mode

## Installation

### Option 1: Install from VSIX (Recommended)
```bash
# Download or build the .vsix file
vsce package

# Install in VS Code
code --install-extension graphql-pair-opener-0.2.4.vsix
```

### Option 2: Install from Marketplace
Search for "GraphQL Pair Opener" in the VS Code Extensions marketplace.

## Configuration

Configure the extension to match your project structure by setting these workspace or user settings:

```jsonc
{
  "graphqlPairOpener.resolverPath": "src/graphql/resolvers",
  "graphqlPairOpener.typeDefPath": "src/graphql/typeDefs", 
  "graphqlPairOpener.openInSplitView": true,
  "graphqlPairOpener.usePreviewMode": false
}
```

### Configuration Options:

| Setting | Default | Description |
|---------|---------|-------------|
| `resolverPath` | `"src/graphql/resolvers"` | Workspace-relative path to resolver files |
| `typeDefPath` | `"src/graphql/typeDefs"` | Workspace-relative path to type definition files |
| `openInSplitView` | `true` | Open files in split view (beside) vs. new tab |
| `usePreviewMode` | `false` | Open files in preview mode (italicized tab) |

## Usage

1. **Configure Paths**: Set your resolver and typedef directory paths in VS Code settings
2. **Right-Click Files**: Use the context menu on any file in your configured directories
3. **Choose Command**:
   - **"Open Corresponding TypeDef/Resolver File"** - Opens the matching file
   - **"Open Both TypeDef and Resolver Files"** - Opens both files

### Example Project Structure:
```
src/
  graphql/
    resolvers/
      User.ts      ← Right-click here
      Project.js
    typeDefs/
      User.graphql ← Opens this file
      Project.ts
```

## How It Works

The extension matches files by their base filename (without extension). For example:
- `resolvers/User.ts` ↔ `typeDefs/User.graphql`
- `resolvers/Project.js` ↔ `typeDefs/Project.ts`

It uses VS Code's file search API to find matching files, making it flexible across different file extensions and project structures.

## Development

### Building from Source:
```bash
npm install
npm run build
```

### Available Scripts:
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode compilation
- `npm run lint` - Run Biome linter
- `npm run build` - Full build and package
- `npm run build:install` - Build and install locally
