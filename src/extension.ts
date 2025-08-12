/**
 * GraphQL Pair Opener - VS Code Extension
 *
 * This extension adds a command to the file explorer's context menu.
 * When a user right-clicks on a GraphQL resolver or type definition file,
 * it provides an option to open its corresponding counterpart.
 */

import * as path from "node:path";
import * as vscode from "vscode";

async function findCorrespondingFile(targetDir: string, baseName: string) {
  // Use a glob pattern to find the corresponding file. This is flexible
  // and works even if the file extensions are different.
  const searchPattern = `**/${targetDir}/${baseName}.*`;
  const foundFiles = await vscode.workspace.findFiles(searchPattern, "**/node_modules/**", 1);

  if (foundFiles.length > 0) {
    const fileToOpenUri = foundFiles[0];
    return fileToOpenUri;
  } else {
    vscode.window.showInformationMessage(
      `GraphQL Pair Opener: No corresponding file found in '${targetDir}'.`
    );
  }
}

/**
 * Updates context keys based on the currently active file
 */
function updateContextKeys() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.commands.executeCommand("setContext", "graphqlPairOpener.isInSupportedDir", false);
    return;
  }

  const config = vscode.workspace.getConfiguration("graphqlPairOpener");
  const resolverDir = config.get<string>("resolverPath");
  const typeDefDir = config.get<string>("typeDefPath");

  if (!resolverDir || !typeDefDir) {
    vscode.commands.executeCommand("setContext", "graphqlPairOpener.isInSupportedDir", false);
    return;
  }

  const workspaceRelativePath = vscode.workspace.asRelativePath(activeEditor.document.uri.fsPath);
  const isInSupportedDir =
    workspaceRelativePath.startsWith(resolverDir) || workspaceRelativePath.startsWith(typeDefDir);

  vscode.commands.executeCommand(
    "setContext",
    "graphqlPairOpener.isInSupportedDir",
    isInSupportedDir
  );
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

  // Listen for active editor changes and configuration changes to update context keys
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateContextKeys()));
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("graphqlPairOpener")) {
        updateContextKeys();
      }
    })
  );

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
        const foundFile = await findCorrespondingFile(targetDir, baseName);
        if (foundFile) {
          // Don't re-open a file that's already visible to the user.
          const isAlreadyVisible = vscode.window.visibleTextEditors.some(
            (editor) => editor.document.uri.fsPath === foundFile.fsPath
          );

          if (!isAlreadyVisible) {
            try {
              const docToOpen = await vscode.workspace.openTextDocument(foundFile);

              // Determine the view column based on the user's setting.
              const viewColumn = openInSplitView
                ? vscode.ViewColumn.Beside
                : vscode.ViewColumn.Active;

              // Open the document with the configured preview setting.
              await vscode.window.showTextDocument(docToOpen, {
                preview: usePreviewMode,
                viewColumn,
              });
            } catch (error) {
              console.error("GraphQL Pair Opener: Failed to open document.", error);
              vscode.window.showErrorMessage(
                "GraphQL Pair Opener: Could not open the corresponding file."
              );
            }
          }
          await vscode.window.showTextDocument(foundFile);
        }
      }
    }
  );

  // 3. REGISTER THE OPEN BOTH COMMAND
  const openBothCommand = vscode.commands.registerCommand(
    "graphql-pair-opener.openBoth",
    async (fileUri: vscode.Uri) => {
      if (!fileUri) {
        vscode.window.showWarningMessage(
          "GraphQL Pair Opener: Command must be run from the file explorer context menu."
        );
        return;
      }
      const clickedFilePath = fileUri.fsPath;

      // Get user configuration
      const config = vscode.workspace.getConfiguration("graphqlPairOpener");
      const resolverDir = config.get<string>("resolverPath");
      const typeDefDir = config.get<string>("typeDefPath");
      const openInSplitView = config.get<boolean>("openInSplitView");

      if (!resolverDir || !typeDefDir) {
        vscode.window.showErrorMessage(
          "GraphQL Pair Opener: Please configure the resolver and type definition paths in your settings."
        );
        return;
      }

      const workspaceRelativePath = vscode.workspace.asRelativePath(clickedFilePath);
      const baseName = path.basename(clickedFilePath, path.extname(clickedFilePath));

      // Check if the clicked file is in one of the configured directories
      if (
        !workspaceRelativePath.startsWith(resolverDir) &&
        !workspaceRelativePath.startsWith(typeDefDir)
      ) {
        return;
      }

      // Find both files
      const resolverFile = await findCorrespondingFile(resolverDir, baseName);
      const typeDefFile = await findCorrespondingFile(typeDefDir, baseName);

      // Open the original file first if it's not already visible
      const isOriginalVisible = vscode.window.visibleTextEditors.some(
        (editor) => editor.document.uri.fsPath === clickedFilePath
      );

      if (!isOriginalVisible) {
        try {
          const originalDoc = await vscode.workspace.openTextDocument(fileUri);
          await vscode.window.showTextDocument(originalDoc, {
            preview: false,
            viewColumn: vscode.ViewColumn.Active,
          });
        } catch (error) {
          console.error("GraphQL Pair Opener: Failed to open original document.", error);
        }
      }

      // Open resolver file
      if (resolverFile) {
        const isResolverVisible = vscode.window.visibleTextEditors.some(
          (editor) => editor.document.uri.fsPath === resolverFile.fsPath
        );

        if (!isResolverVisible) {
          try {
            const resolverDoc = await vscode.workspace.openTextDocument(resolverFile);
            await vscode.window.showTextDocument(resolverDoc, {
              preview: false,
              viewColumn: openInSplitView ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
              preserveFocus: true,
            });
          } catch (error) {
            console.error("GraphQL Pair Opener: Failed to open resolver document.", error);
          }
        }
      }

      // Open typedef file
      if (typeDefFile) {
        const isTypeDefVisible = vscode.window.visibleTextEditors.some(
          (editor) => editor.document.uri.fsPath === typeDefFile.fsPath
        );

        if (!isTypeDefVisible) {
          try {
            const typeDefDoc = await vscode.workspace.openTextDocument(typeDefFile);
            await vscode.window.showTextDocument(typeDefDoc, {
              preview: false,
              viewColumn: openInSplitView ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
              preserveFocus: true,
            });
          } catch (error) {
            console.error("GraphQL Pair Opener: Failed to open typedef document.", error);
          }
        }
      }

      // Show a message if neither corresponding file was found
      if (!resolverFile && !typeDefFile) {
        vscode.window.showInformationMessage("GraphQL Pair Opener: No corresponding files found.");
      }
    }
  );

  // Add the commands to the context's subscriptions to ensure they're cleaned up
  // when the extension is deactivated.
  context.subscriptions.push(openPairCommand, openBothCommand);
}

/**
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}
