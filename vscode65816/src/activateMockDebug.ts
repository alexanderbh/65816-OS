/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * activateMockDebug.ts containes the shared extension code that can be executed both in node.js and the browser.
 */

"use strict";

import * as vscode from "vscode";
import {
  WorkspaceFolder,
  DebugConfiguration,
  ProviderResult,
  CancellationToken,
} from "vscode";
import { FileAccessor } from "./debugAdapter";
import { MockDebugSession } from "./mockDebug";

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>65816 I/O</title>
    <style>
    @font-face {
      font-family: 'VT323';
      src: url('https://fonts.googleapis.com/css?family=VT323');
    }
    </style>
</head>
<body style="background-color: #BABABA;">
    <canvas id="canvas" width="800" height="480" style="background-color: black; border: 8px solid gray"></canvas>
    <br/>
    <input type="text" id="input" style="width: 800px; font-family: 'VT323'; font-size: 24px; padding: 4px; border: 2px solid gray; background-color: black; color: white;"/>
    <script>
    const input = document.getElementById("input");
    input.focus();

    new FontFace('VT323', 'url(https://fonts.gstatic.com/s/vt323/v17/pxiKyp0ihIEF2isfFJU.woff2)').load().then(function(font) {
      document.fonts.add(font);
  
    const ctx = document.getElementById('canvas').getContext('2d');
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.font = '20px VT323';
      let X = 0;
      let Y = 0;
      window.addEventListener('message', event => {
        
        const message = event.data; // The JSON data our extension sent

        switch (message.command) {
          case 'cursorx':
            X = message.value;
            break;
          case 'cursory':
            Y = message.value;
            break;
          case 'write':
            const s = String.fromCharCode(message.char);
            ctx.fillStyle = 'black';
            ctx.fillRect(X+1, Y+3, s === " " ? 7 : 8, 15);
            ctx.fillStyle = 'white';
            ctx.fillText(s, X, Y+16);
            X += 8;
            if (X >= 800) {
              X = 0;
              Y += 16;
            }
            break;
        }
      });
    });
    </script>
</body>
</html>`;
}

export function activateMockDebug(
  context: vscode.ExtensionContext,
  factory?: vscode.DebugAdapterDescriptorFactory
) {
  const panel = vscode.window.createWebviewPanel(
    "ca65io", // Identifies the type of the webview. Used internally
    "65816 I/O", // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    {
      // Enable scripts in the webview
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = getWebviewContent();

  // register a configuration provider for 'mock' debug type
  const provider = new MockConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider("mock", provider)
  );

  // register a dynamic configuration provider for 'mock' debug type
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "mock",
      {
        provideDebugConfigurations(
          folder: WorkspaceFolder | undefined
        ): ProviderResult<DebugConfiguration[]> {
          return [
            {
              name: "Dynamic Launch",
              request: "launch",
              type: "mock",
              program: "${file}",
            },
            {
              name: "Another Dynamic Launch",
              request: "launch",
              type: "mock",
              program: "${file}",
            },
            {
              name: "Mock Launch",
              request: "launch",
              type: "mock",
              program: "${file}",
            },
          ];
        },
      },
      vscode.DebugConfigurationProviderTriggerKind.Dynamic
    )
  );

  if (!factory) {
    factory = new InlineDebugAdapterFactory(panel);
  }
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("mock", factory)
  );
  if ("dispose" in factory) {
    context.subscriptions.push(factory);
  }

  // override VS Code's default implementation of the debug hover
  // here we match only Mock "variables", that are words starting with an '$'
  context.subscriptions.push(
    vscode.languages.registerEvaluatableExpressionProvider("ca65", {
      provideEvaluatableExpression(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.EvaluatableExpression> {
        const VARIABLE_REGEXP = /\$[a-z][a-z0-9]*/gi;
        const line = document.lineAt(position.line).text;

        let m: RegExpExecArray | null;
        while ((m = VARIABLE_REGEXP.exec(line))) {
          const varRange = new vscode.Range(
            position.line,
            m.index,
            position.line,
            m.index + m[0].length
          );

          if (varRange.contains(position)) {
            return new vscode.EvaluatableExpression(varRange);
          }
        }
        return undefined;
      },
    })
  );

  // override VS Code's default implementation of the "inline values" feature"
  context.subscriptions.push(
    vscode.languages.registerInlineValuesProvider("ca65", {
      provideInlineValues(
        document: vscode.TextDocument,
        viewport: vscode.Range,
        context: vscode.InlineValueContext
      ): vscode.ProviderResult<vscode.InlineValue[]> {
        const allValues: vscode.InlineValue[] = [];

        for (
          let l = viewport.start.line;
          l <= context.stoppedLocation.end.line;
          l++
        ) {
          const line = document.lineAt(l);
          var regExp = /\$([a-z][a-z0-9]*)/gi; // variables are words starting with '$'
          do {
            var m = regExp.exec(line.text);
            if (m) {
              const varName = m[1];
              const varRange = new vscode.Range(
                l,
                m.index,
                l,
                m.index + varName.length
              );

              // some literal text
              //allValues.push(new vscode.InlineValueText(varRange, `${varName}: ${viewport.start.line}`));

              // value found via variable lookup
              allValues.push(
                new vscode.InlineValueVariableLookup(varRange, varName, false)
              );

              // value determined via expression evaluation
              //allValues.push(new vscode.InlineValueEvaluatableExpression(varRange, varName));
            }
          } while (m);
        }

        return allValues;
      },
    })
  );
}

class MockConfigurationProvider implements vscode.DebugConfigurationProvider {
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    token?: CancellationToken
  ): ProviderResult<DebugConfiguration> {
    // if launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "ca65") {
        config.type = "mock";
        config.name = "Launch";
        config.request = "launch";
        config.program = "${file}";
        config.stopOnEntry = true;
      }
    }

    if (!config.program) {
      return vscode.window
        .showInformationMessage("Cannot find a program to debug")
        .then((_) => {
          return undefined; // abort launch
        });
    }

    return config;
  }
}

export const workspaceFileAccessor: FileAccessor = {
  async readFile(path: string): Promise<Uint8Array> {
    let uri: vscode.Uri;
    try {
      uri = pathToUri(path);
    } catch (e) {
      return new TextEncoder().encode(`cannot read '${path}'`);
    }

    return await vscode.workspace.fs.readFile(uri);
  },
  async writeFile(path: string, contents: Uint8Array) {
    await vscode.workspace.fs.writeFile(pathToUri(path), contents);
  },
};

function pathToUri(path: string) {
  try {
    return vscode.Uri.file(path);
  } catch (e) {
    return vscode.Uri.parse(path);
  }
}

class InlineDebugAdapterFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  constructor(private panel: vscode.WebviewPanel) {}
  createDebugAdapterDescriptor(
    _session: vscode.DebugSession
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    return new vscode.DebugAdapterInlineImplementation(
      new MockDebugSession(workspaceFileAccessor, this.panel)
    );
  }
}
