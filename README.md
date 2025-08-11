# GraphQL Pair Opener
A simple but powerful VS Code extension to improve your GraphQL development workflow.

## Features
This extension automatically opens the corresponding GraphQL file when you open either a resolver or a type definition.

- Open a resolver file (e.g., `src/graphql/resolvers/user.ts`).

- The corresponding type definition (e.g., `src/graphql/typeDefs/user.graphql`) automatically opens in a split-screen view.

- The same thing happens in reverse if you open the type definition first.

This saves you the time and effort of manually searching for and opening related files.

## How to Use
1. **Install the Extension**: Build the .vsix file and install it in VS Code. 
You can do this by running the following command in your terminal:
```bash
vsce package
```
Then, install the generated `.vsix` file in VS Code by going to `Extensions > Install from VSIX...`.

2. **Configure Paths**: This extension works by knowing where your resolver and type definition files are. You must configure these paths in your VS Code settings.

- Open your settings: `File > Preferences > Settings` (or `Code > Settings > Settings on macOS`).

- Search for "GraphQL Pair Opener".

- Set the `Resolver Path` and `TypeDef Path` to match your project's structure. The paths should be relative to your workspace root.

For example, in your `.vscode/settings.json`:

```jsonc
{
  // Example .vscode/settings.json (default options)
  "graphqlPairOpener.resolverPath": "src/graphql/resolvers",
  "graphqlPairOpener.typeDefPath": "src/graphql/typeDefs",
  "graphqlPairOpener.openInSplitView": true
}
```
3. **Start Coding**: That's it! Just open a file from one of the configured directories, and its counterpart will appear.

## Next Steps
The next planned feature is to also open the corresponding Sequelize model file, giving you a three-way view of your data structure: the database model, the GraphQL schema, and the resolver logic.