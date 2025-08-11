/**
 * GraphQL Pair Opener - VS Code Extension
 *
 * This extension adds a command to the file explorer's context menu.
 * When a user right-clicks on a GraphQL resolver or type definition file,
 * it provides an option to open its corresponding counterpart.
 */

import * as path from "node:path";
import * as vscode from "vscode";

/**
 * Updates context keys based on the currently active file
 */
function updateContextKeys() {
  const config = vscode.workspace.getConfiguration("graphqlPairOpener");
  const resolverDir = config.get<string>("resolverPath");
  const typeDefDir = config.get<string>("typeDefPath");
  // get all files in the given dirs
  const supportedDirs: string[] = [];

  if (resolverDir) {
    supportedDirs.push(
      `${vscode.workspace.workspaceFolders?.[0].uri.fsPath}/${resolverDir}`,
      resolverDir
    );
  }
  if (typeDefDir) {
    supportedDirs.push(
      `${vscode.workspace.workspaceFolders?.[0].uri.fsPath}/${typeDefDir}`,
      typeDefDir
    );
  }
  vscode.commands.executeCommand("setContext", "graphqlPairOpener.supportedDirs", supportedDirs);
}

/**
 * This is the main activation function for the extension.
 * It's called by VS Code when the extension is activated, which happens
 * when the user first triggers one of its contributed commands.
 *
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
  // 1. SET UP CONTEXT KEYS
  updateContextKeys();

  // Listen for active editor changes to update context keys
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateContextKeys()));

  // 2. REGISTER THE COMMAND
  // This creates the command 'graphql-pair-opener.openPair' and defines
  // the logic that will execute when it's called.
  const openPairCommand = vscode.commands.registerCommand(
    "graphql-pair-opener.openPair",
    async (fileUri: vscode.Uri) => {
      // The 'fileUri' is provided by VS Code and represents the file that was right-clicked.
      if (!fileUri) {
        vscode.window.showWarningMessage(
          "GraphQL Pair Opener: Command must be run from the file explorer context menu."
        );
        return;
      }
      const clickedFilePath = fileUri.fsPath;

      // 2. GET USER CONFIGURATION
      const config = vscode.workspace.getConfiguration("graphqlPairOpener");
      const resolverDir = config.get<string>("resolverPath");
      const typeDefDir = config.get<string>("typeDefPath");
      const openInSplitView = config.get<boolean>("openInSplitView");
      const usePreviewMode = config.get<boolean>("usePreviewMode");

      if (!resolverDir || !typeDefDir) {
        vscode.window.showErrorMessage(
          "GraphQL Pair Opener: Please configure the resolver and type definition paths in your settings."
        );
        return;
      }

      // 3. DETERMINE WHICH FILE WAS CLICKED (RESOLVER OR TYPEDEF)
      const workspaceRelativePath = vscode.workspace.asRelativePath(clickedFilePath);
      const baseName = path.basename(clickedFilePath, path.extname(clickedFilePath));

      let targetDir: string | undefined;

      // Check if the clicked file is a resolver.
      if (workspaceRelativePath.startsWith(resolverDir)) {
        targetDir = typeDefDir;
      }
      // Check if the clicked file is a type definition.
      else if (workspaceRelativePath.startsWith(typeDefDir)) {
        targetDir = resolverDir;
      } else {
        // Silently exit if the file is not in a configured directory.
        // This prevents the command from doing anything on unrelated files.
        return;
      }

      // 4. FIND AND OPEN THE CORRESPONDING FILE
      if (targetDir) {
        // Use a glob pattern to find the corresponding file. This is flexible
        // and works even if the file extensions are different.
        const searchPattern = `**/${targetDir}/${baseName}.*`;
        const foundFiles = await vscode.workspace.findFiles(searchPattern, "**/node_modules/**", 1);

        if (foundFiles.length > 0) {
          const fileToOpenUri = foundFiles[0];

          // Don't re-open a file that's already visible to the user.
          const isAlreadyVisible = vscode.window.visibleTextEditors.some(
            (editor) => editor.document.uri.fsPath === fileToOpenUri.fsPath
          );

          if (!isAlreadyVisible) {
            try {
              const docToOpen = await vscode.workspace.openTextDocument(fileToOpenUri);

              // Determine the view column based on the user's setting.
              const viewColumn = openInSplitView
                ? vscode.ViewColumn.Beside
                : vscode.ViewColumn.Active;

              // Open the document with the configured preview setting.
              await vscode.window.showTextDocument(docToOpen, {
                preview: usePreviewMode,
                viewColumn: viewColumn,
              });
            } catch (error) {
              console.error("GraphQL Pair Opener: Failed to open document.", error);
              vscode.window.showErrorMessage(
                "GraphQL Pair Opener: Could not open the corresponding file."
              );
            }
          }
        } else {
          vscode.window.showInformationMessage(
            `GraphQL Pair Opener: No corresponding file found in '${targetDir}'.`
          );
        }
      }
    }
  );

  // Add the command to the context's subscriptions to ensure it's cleaned up
  // when the extension is deactivated.
  context.subscriptions.push(openPairCommand);
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}
