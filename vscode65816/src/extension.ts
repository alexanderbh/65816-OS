"use strict";

import * as vscode from "vscode";
import { activateMockDebug } from "./activateMockDebug";

export function activate(context: vscode.ExtensionContext) {
  activateMockDebug(context);
}

export function deactivate() {
  // nothing to do
}
