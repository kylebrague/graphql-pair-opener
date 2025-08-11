/**
 * GraphQL Pair Opener - VS Code Extension
 *
 * This extension enhances workflow by automatically opening related files
 * in a GraphQL project structure. When a resolver or a type definition file
 * is opened, its counterpart is automatically opened. The user can configure
 * whether the file opens in a split view or the same editor panel, and
 * whether it opens in preview mode.
 */

import * as path from "node:path";
import * as vscode from "vscode";

/**
 * A Set to temporarily store the paths of files opened by this extension.
 * This is a crucial mechanism to prevent an infinite loop where opening file A
 * triggers opening file B, which in turn triggers opening file A again.
 */
const openedByExtension = new Set<string>();

/**
 * This is the main activation function for the extension.
 * It's called by VS Code when the extension is activated (e.g., on startup).
 * It sets up the event listener that powers the extension's core functionality.
 *
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
  // Register a listener for when any text document is opened in the workspace.
  const onOpenDocumentDisposable = vscode.workspace.onDidOpenTextDocument(
    async (document: vscode.TextDocument) => {
      const openedFilePath = document.uri.fsPath;

      // 1. PREVENT INFINITE LOOPS
      if (openedByExtension.has(openedFilePath)) {
        openedByExtension.delete(openedFilePath);
        return;
      }

      // 2. GET USER CONFIGURATION
      const config = vscode.workspace.getConfiguration("graphqlPairOpener");
      const resolverDir = config.get<string>("resolverPath");
      const typeDefDir = config.get<string>("typeDefPath");
      // Kill if extension does not need to run
      const workspaceRelativePath = vscode.workspace.asRelativePath(openedFilePath);
      if (
        !resolverDir ||
        !typeDefDir ||
        (!workspaceRelativePath.startsWith(resolverDir) &&
          !workspaceRelativePath.startsWith(typeDefDir))
      ) {
        return;
      }
      const openInSplitView = config.get<boolean>("openInSplitView");
      const usePreviewMode = config.get<boolean>("usePreviewMode");

      // 3. DETERMINE WHICH FILE WAS OPENED (RESOLVER OR TYPEDEF)
      const baseName = path.basename(openedFilePath, path.extname(openedFilePath));
      let targetDir: string | undefined;

      if (workspaceRelativePath.startsWith(resolverDir)) {
        targetDir = typeDefDir;
      } else if (workspaceRelativePath.startsWith(typeDefDir)) {
        targetDir = resolverDir;
      }

      // 4. FIND AND OPEN THE CORRESPONDING FILE
      if (targetDir) {
        const searchPattern = `**/${targetDir}/${baseName}.*`;
        const foundFiles = await vscode.workspace.findFiles(searchPattern, "**/node_modules/**", 1);

        if (foundFiles?.length > 0) {
          const fileToOpenUri = foundFiles[0];

          const isAlreadyVisible = vscode.window.visibleTextEditors.some(
            (editor) => editor.document.uri.fsPath === fileToOpenUri.fsPath
          );

          if (!isAlreadyVisible) {
            openedByExtension.add(fileToOpenUri.fsPath);

            try {
              const docToOpen = await vscode.workspace.openTextDocument(fileToOpenUri);
              // Use the new setting to control preview mode
              await vscode.window.showTextDocument(docToOpen, {
                preview: usePreviewMode,
                viewColumn: openInSplitView ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
                preserveFocus: true,
              });
            } catch (error) {
              console.error("GraphQL Pair Opener: Failed to open document.", error);
              openedByExtension.delete(fileToOpenUri.fsPath);
            }

            setTimeout(() => {
              openedByExtension.delete(fileToOpenUri.fsPath);
            }, 300);
          }
        }
      }
    }
  );

  context.subscriptions.push(onOpenDocumentDisposable);
}

export function deactivate() {}
