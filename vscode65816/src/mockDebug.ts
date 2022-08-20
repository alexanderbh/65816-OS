/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * mockDebug.ts implements the Debug Adapter that "adapts" or translates the Debug Adapter Protocol (DAP) used by the client (e.g. VS Code)
 * into requests and events of the real "execution engine" or "debugger" (here: class MockRuntime).
 * When implementing your own debugger extension for VS Code, most of the work will go into the Debug Adapter.
 * Since the Debug Adapter is independent from VS Code, it can be used in any client (IDE) supporting the Debug Adapter Protocol.
 *
 * The most important class of the Debug Adapter is the MockDebugSession which implements many DAP requests by talking to the MockRuntime.
 */

import {
  Logger,
  logger,
  LoggingDebugSession,
  InitializedEvent,
  InvalidatedEvent,
  Thread,
  Scope,
  Handles,
  StoppedEvent,
  BreakpointEvent,
  OutputEvent,
  TerminatedEvent,
  Source,
  StackFrame,
} from "@vscode/debugadapter";
import { DebugProtocol } from "@vscode/debugprotocol";
import {
  FileAccessor,
  IRuntimeBreakpoint,
  RuntimeVariable,
} from "./mockRuntime";
import { System } from "./lib/System";
import { Subject } from "await-notify";
import * as base64 from "base64-js";
import { Register } from "./lib/CPU";
import { ROM } from "./lib/ROM";
import { basename } from "path";

/**
 * This interface describes the mock-debug specific launch attributes
 * (which are not part of the Debug Adapter Protocol).
 * The schema for these attributes lives in the package.json of the mock-debug extension.
 * The interface should always match this schema.
 */
interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  /** An absolute path to the "program" to debug. */
  program: string;
  /** Automatically stop target after launch. If not specified, target does not stop. */
  stopOnEntry?: boolean;
  /** enable logging the Debug Adapter Protocol */
  trace?: boolean;
  /** run without debugging */
  noDebug?: boolean;
  /** if specified, results in a simulated compile error in launch. */
  compileError?: "default" | "show" | "hide";

  workspacePath: string;
}

interface IAttachRequestArguments extends ILaunchRequestArguments {}

export class MockDebugSession extends LoggingDebugSession {
  // we don't support multiple threads, so we can use a hardcoded ID for the default thread
  private static threadID = 1;

  private _workspacePath?: string;
  private _symbolNameTable: Map<number, string> = new Map();

  private _system: System;

  private _variableHandles = new Handles<
    "locals" | "registers" | "emulator" | RuntimeVariable
  >();

  private _configurationDone = new Subject();

  private _cancellationTokens = new Map<number, boolean>();

  private _valuesInHex = false;
  private _useInvalidatedEvent = false;
  private _sourceFile?: string;

  private _pcToFileLine: Map<number, { file: string; line: number }> =
    new Map();

  /**
   * Creates a new debug adapter that is used for one debug session.
   * We configure the default implementation of a debug adapter here.
   */
  public constructor(private fileAccessor: FileAccessor) {
    super("mock-debug.txt");

    // this debugger uses zero-based lines and columns
    this.setDebuggerLinesStartAt1(false);
    this.setDebuggerColumnsStartAt1(false);

    this._system = new System();

    // setup event handlers
    this._system.on("stopOnEntry", () => {
      this.sendEvent(new StoppedEvent("entry", MockDebugSession.threadID));
    });
    this._system.on("stopOnStep", () => {
      this.sendEvent(new StoppedEvent("step", MockDebugSession.threadID));
    });
    this._system.on("stopOnBreakpoint", () => {
      this.sendEvent(new StoppedEvent("breakpoint", MockDebugSession.threadID));
    });
    this._system.on("stopOnDataBreakpoint", () => {
      this.sendEvent(
        new StoppedEvent("data breakpoint", MockDebugSession.threadID)
      );
    });
    this._system.on("stopOnInstructionBreakpoint", () => {
      this.sendEvent(
        new StoppedEvent("instruction breakpoint", MockDebugSession.threadID)
      );
    });
    this._system.on("stopOnException", (exception) => {
      if (exception) {
        this.sendEvent(
          new StoppedEvent(`exception(${exception})`, MockDebugSession.threadID)
        );
      } else {
        this.sendEvent(
          new StoppedEvent("exception", MockDebugSession.threadID)
        );
      }
    });
    this._system.on("breakpointValidated", (bp: IRuntimeBreakpoint) => {
      this.sendEvent(
        new BreakpointEvent("changed", {
          verified: bp.verified,
          id: bp.id,
        } as DebugProtocol.Breakpoint)
      );
    });
    this._system.on("output", (type, text, filePath, line, column) => {
      let category: string;
      switch (type) {
        case "prio":
          category = "important";
          break;
        case "out":
          category = "stdout";
          break;
        case "err":
          category = "stderr";
          break;
        default:
          category = "console";
          break;
      }
      const e: DebugProtocol.OutputEvent = new OutputEvent(
        `${text}\n`,
        category
      );

      if (text === "start" || text === "startCollapsed" || text === "end") {
        e.body.group = text;
        e.body.output = `group-${text}\n`;
      }

      e.body.source = this.createSource(filePath);
      e.body.line = this.convertDebuggerLineToClient(line);
      e.body.column = this.convertDebuggerColumnToClient(column);
      this.sendEvent(e);
    });
    this._system.on("end", () => {
      this.sendEvent(new TerminatedEvent());
    });
  }

  /**
   * The 'initialize' request is the first request called by the frontend
   * to interrogate the features the debug adapter provides.
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments
  ): void {
    if (args.supportsInvalidatedEvent) {
      this._useInvalidatedEvent = true;
    }

    // build and return the capabilities of this debug adapter:
    response.body = response.body || {};

    // the adapter implements the configurationDone request.
    response.body.supportsConfigurationDoneRequest = true;

    // make VS Code use 'evaluate' when hovering over source
    response.body.supportsEvaluateForHovers = true;

    // make VS Code show a 'step back' button
    response.body.supportsStepBack = false;

    // make VS Code support data breakpoints
    response.body.supportsDataBreakpoints = true;

    // make VS Code support completion in REPL
    response.body.supportsCompletionsRequest = false;

    // make VS Code send cancel request
    response.body.supportsCancelRequest = true;

    // make VS Code send the breakpointLocations request
    response.body.supportsBreakpointLocationsRequest = true;

    // make VS Code provide "Step in Target" functionality
    response.body.supportsStepInTargetsRequest = false;

    // the adapter defines two exceptions filters, one with support for conditions.
    response.body.supportsExceptionFilterOptions = false;

    // make VS Code send exceptionInfo request
    response.body.supportsExceptionInfoRequest = false;

    // make VS Code send setVariable request
    response.body.supportsSetVariable = true;

    // make VS Code send setExpression request
    response.body.supportsSetExpression = true;

    // make VS Code send disassemble request
    response.body.supportsDisassembleRequest = false;
    response.body.supportsSteppingGranularity = true;
    response.body.supportsInstructionBreakpoints = true;

    // make VS Code able to read and write variable memory
    response.body.supportsReadMemoryRequest = true;
    response.body.supportsWriteMemoryRequest = true;

    response.body.supportSuspendDebuggee = true;
    response.body.supportTerminateDebuggee = true;
    response.body.supportsFunctionBreakpoints = true;

    this.sendResponse(response);

    // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
    // we request them early by sending an 'initializeRequest' to the frontend.
    // The frontend will end the configuration sequence by calling 'configurationDone' request.
    this.sendEvent(new InitializedEvent());
  }

  /**
   * Called at the end of the configuration sequence.
   * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
   */
  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    args: DebugProtocol.ConfigurationDoneArguments
  ): void {
    super.configurationDoneRequest(response, args);

    // notify the launchRequest that configuration has finished
    this._configurationDone.notify();
  }

  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    args: DebugProtocol.DisconnectArguments,
    request?: DebugProtocol.Request
  ): void {
    console.log(
      `disconnectRequest suspend: ${args.suspendDebuggee}, terminate: ${args.terminateDebuggee}`
    );
  }

  protected async attachRequest(
    response: DebugProtocol.AttachResponse,
    args: IAttachRequestArguments
  ) {
    return this.launchRequest(response, args);
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: ILaunchRequestArguments
  ) {
    // make sure to 'Stop' the buffered logging if 'trace' is not set
    logger.setup(
      args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop,
      false
    );

    this._workspacePath = args.workspacePath;
    // wait 1 second until configuration has finished (and configurationDoneRequest has been called)
    await this._configurationDone.wait(1000);

    // prepare PC map
    const dgbFileContent = await this.fileAccessor.readFile(
      this.normalizePathAndCasing(args.program.replace(".bin", ".dbg"))
    );
    const dgbFile = dgbFileContent.toString();
    this.preparePCMapping(dgbFile);

    // Load binary
    this._sourceFile = this.normalizePathAndCasing(args.program);
    // start the program in the runtime
    const rom = new ROM(
      await this.fileAccessor.readFile(this._sourceFile),
      0x4000
    );
    this._system.start(rom, !args.noDebug, !!args.stopOnEntry);

    // await this._system.start(args.program, !!args.stopOnEntry, !args.noDebug);

    if (args.compileError) {
      // simulate a compile/build error in "launch" request:
      // the error should not result in a modal dialog since 'showUser' is set to false.
      // A missing 'showUser' should result in a modal dialog.
      this.sendErrorResponse(response, {
        id: 1001,
        format: `compile error: some fake error.`,
        showUser:
          args.compileError === "show"
            ? true
            : args.compileError === "hide"
            ? false
            : undefined,
      });
    } else {
      this.sendResponse(response);
    }
  }

  protected setFunctionBreakPointsRequest(
    response: DebugProtocol.SetFunctionBreakpointsResponse,
    args: DebugProtocol.SetFunctionBreakpointsArguments,
    request?: DebugProtocol.Request
  ): void {
    this.sendResponse(response);
  }

  protected async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments
  ): Promise<void> {
    // const path = args.source.path as string;
    // const clientLines = args.lines || [];
    // // clear all breakpoints for this file
    // this._system.clearBreakpoints(path);
    // // set and verify breakpoint locations
    // const actualBreakpoints0 = clientLines.map(async (l) => {
    //   const { verified, line, id } = await this._system.setBreakPoint(
    //     path,
    //     this.convertClientLineToDebugger(l)
    //   );
    //   const bp = new Breakpoint(
    //     verified,
    //     this.convertDebuggerLineToClient(line)
    //   ) as DebugProtocol.Breakpoint;
    //   bp.id = id;
    //   return bp;
    // });
    // const actualBreakpoints = await Promise.all<DebugProtocol.Breakpoint>(
    //   actualBreakpoints0
    // );
    // // send back the actual breakpoint positions
    // response.body = {
    //   breakpoints: actualBreakpoints,
    // };
    this.sendResponse(response);
  }

  protected breakpointLocationsRequest(
    response: DebugProtocol.BreakpointLocationsResponse,
    args: DebugProtocol.BreakpointLocationsArguments,
    request?: DebugProtocol.Request
  ): void {
    // if (args.source.path) {
    //   const bps = this._system.getBreakpoints(
    //     args.source.path,
    //     this.convertClientLineToDebugger(args.line)
    //   );
    //   response.body = {
    //     breakpoints: bps.map((col) => {
    //       return {
    //         line: args.line,
    //         column: this.convertDebuggerColumnToClient(col),
    //       };
    //     }),
    //   };
    // } else {
    //   response.body = {
    //     breakpoints: [],
    //   };
    // }
    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [
        new Thread(MockDebugSession.threadID, "thread 1"),
        new Thread(MockDebugSession.threadID + 1, "thread 2"),
      ],
    };
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments
  ): void {
    // const startFrame =
    //   typeof args.startFrame === "number" ? args.startFrame : 0;
    // const maxLevels = typeof args.levels === "number" ? args.levels : 1000;
    // const endFrame = startFrame + maxLevels;

    // const stk = this._system.stack(startFrame, endFrame);

    // response.body = {
    //   stackFrames: stk.frames.map((f, ix) => {
    //     const sf: DebugProtocol.StackFrame = new StackFrame(
    //       f.index,
    //       f.name,
    //       this.createSource(f.file),
    //       this.convertDebuggerLineToClient(f.line)
    //     );
    //     if (typeof f.column === "number") {
    //       sf.column = this.convertDebuggerColumnToClient(f.column);
    //     }
    //     if (typeof f.instruction === "number") {
    //       const address = this.formatAddress(f.instruction);
    //       sf.name = `${f.name} ${address}`;
    //       sf.instructionPointerReference = address;
    //     }

    //     return sf;
    //   }),
    //   // 4 options for 'totalFrames':
    //   //omit totalFrames property: 	// VS Code has to probe/guess. Should result in a max. of two requests
    //   totalFrames: stk.count, // stk.count is the correct size, should result in a max. of two requests
    //   //totalFrames: 1000000 			// not the correct size, should result in a max. of two requests
    //   //totalFrames: endFrame + 20 	// dynamically increases the size with every requested chunk, results in paging
    // };

    response.body = {
      stackFrames: this._system.cpu.callTrace
        .slice()
        .reverse()
        .map(({ entry, exit }, index) => {
          let addrLookup = this._pcToFileLine.get(
            exit || this._system.cpu.PC.word
          );
          if (!addrLookup) {
            addrLookup = {
              file: this._workspacePath + "/src/main.asm",
              line: 0,
            };
          }
          return new StackFrame(
            index,
            this._symbolNameTable.get(entry) || "unknown",
            this.createSource(addrLookup.file),
            addrLookup.line
          );
        }),
      totalFrames: this._system.cpu.callTrace.length,
    };
    this.sendResponse(response);
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments
  ): void {
    response.body = {
      scopes: [
        new Scope(
          "Registers",
          this._variableHandles.create("registers"),
          false
        ),
        new Scope("Emulator", this._variableHandles.create("emulator"), false),
        new Scope("Locals", this._variableHandles.create("locals"), false),
      ],
    };
    this.sendResponse(response);
  }

  protected async writeMemoryRequest(
    response: DebugProtocol.WriteMemoryResponse,
    { data, memoryReference, offset = 0 }: DebugProtocol.WriteMemoryArguments
  ) {
    const variable = this._variableHandles.get(Number(memoryReference));
    if (typeof variable === "object") {
      const decoded = base64.toByteArray(data);
      variable.setMemory(decoded, offset);
      response.body = { bytesWritten: decoded.length };
    } else {
      response.body = { bytesWritten: 0 };
    }

    this.sendResponse(response);
    this.sendEvent(new InvalidatedEvent(["variables"]));
  }

  protected async readMemoryRequest(
    response: DebugProtocol.ReadMemoryResponse,
    { offset = 0, count, memoryReference }: DebugProtocol.ReadMemoryArguments
  ) {
    const variable = this._variableHandles.get(Number(memoryReference));
    if (typeof variable === "object" && variable.memory) {
      const memory = variable.memory.subarray(
        Math.min(offset, variable.memory.length),
        Math.min(offset + count, variable.memory.length)
      );

      response.body = {
        address: offset.toString(),
        data: base64.fromByteArray(memory),
        unreadableBytes: count - memory.length,
      };
    } else {
      response.body = {
        address: offset.toString(),
        data: "",
        unreadableBytes: count,
      };
    }

    this.sendResponse(response);
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
    request?: DebugProtocol.Request
  ): Promise<void> {
    let vs: Register[] = [];

    const v = this._variableHandles.get(args.variablesReference);
    if (v === "locals") {
      // TODO: Support "local" variables
    } else if (v === "registers") {
      const vs = [
        this._system.cpu.A,
        this._system.cpu.X,
        this._system.cpu.Y,
        this._system.cpu.PC,
        this._system.cpu.S,
      ];
      response.body = {
        variables: vs.map((v) => this.convertFromRuntime(v)),
      };
    } else if (v === "emulator") {
      response.body = {
        variables: [
          {
            name: "Cycles",
            value: this._system.cpu.cycles.toString(),
            type: "integer",
            variablesReference: 0,
          },
        ],
      };
    } else if (v && Array.isArray(v.value)) {
    }

    this.sendResponse(response);
  }

  protected setVariableRequest(
    response: DebugProtocol.SetVariableResponse,
    args: DebugProtocol.SetVariableArguments
  ): void {
    const container = this._variableHandles.get(args.variablesReference);

    if (container === "registers") {
      // TODO
    } else {
      // Not supported yet
      /**
		 const rv =
      container === "locals"
        ? this._system.getLocalVariable(args.name)
        : container instanceof RuntimeVariable &&
          container.value instanceof Array
        ? container.value.find((v) => v.name === args.name)
        : undefined;

    if (rv) {
      rv.value = this.convertToRuntime(args.value);
      response.body = this.convertFromRuntime(rv);

      if (rv.memory && rv.reference) {
        this.sendEvent(
          new MemoryEvent(String(rv.reference), 0, rv.memory.length)
        );
      }
    }
		 */
    }

    this.sendResponse(response);
  }

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments
  ): void {
    //this._system.continue(false);
    this._system.run();
    this.sendResponse(response);
  }

  protected reverseContinueRequest(
    response: DebugProtocol.ReverseContinueResponse,
    args: DebugProtocol.ReverseContinueArguments
  ): void {
    // this._system.continue(true);
    this.sendResponse(response);
  }

  protected pauseRequest(
    response: DebugProtocol.PauseResponse,
    args: DebugProtocol.PauseArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this._system.pause();
    this.sendResponse(response);
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments
  ): void {
    this._system.step();
    this.sendResponse(response);
  }

  protected stepBackRequest(
    response: DebugProtocol.StepBackResponse,
    args: DebugProtocol.StepBackArguments
  ): void {
    // this._system.step();
    this.sendResponse(response);
  }

  protected stepInTargetsRequest(
    response: DebugProtocol.StepInTargetsResponse,
    args: DebugProtocol.StepInTargetsArguments
  ) {
    // const targets = this._system.getStepInTargets(args.frameId);
    // response.body = {
    //   targets: targets.map((t) => {
    //     return { id: t.id, label: t.label };
    //   }),
    // };
    this.sendResponse(response);
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments
  ): void {
    // TODO: Support step in
    this._system.step();
    this.sendResponse(response);
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments
  ): void {
    // TODO: Support step out
    this._system.step();
    this.sendResponse(response);
  }

  protected dataBreakpointInfoRequest(
    response: DebugProtocol.DataBreakpointInfoResponse,
    args: DebugProtocol.DataBreakpointInfoArguments
  ): void {
    response.body = {
      dataId: null,
      description: "cannot break on data access",
      accessTypes: undefined,
      canPersist: false,
    };

    if (args.variablesReference && args.name) {
      const v = this._variableHandles.get(args.variablesReference);
      if (v === "registers") {
        response.body.dataId = args.name;
        response.body.description = args.name;
        response.body.accessTypes = ["read", "write", "readWrite"];
        response.body.canPersist = true;
      } else {
        response.body.dataId = args.name;
        response.body.description = args.name;
        response.body.accessTypes = ["read", "write", "readWrite"];
        response.body.canPersist = true;
      }
    }

    this.sendResponse(response);
  }

  protected setDataBreakpointsRequest(
    response: DebugProtocol.SetDataBreakpointsResponse,
    args: DebugProtocol.SetDataBreakpointsArguments
  ): void {
    // // clear all data breakpoints
    // this._system.clearAllDataBreakpoints();
    // response.body = {
    //   breakpoints: [],
    // };
    // for (const dbp of args.breakpoints) {
    //   const ok = this._system.setDataBreakpoint(
    //     dbp.dataId,
    //     dbp.accessType || "write"
    //   );
    //   response.body.breakpoints.push({
    //     verified: ok,
    //   });
    // }
    this.sendResponse(response);
  }

  protected completionsRequest(
    response: DebugProtocol.CompletionsResponse,
    args: DebugProtocol.CompletionsArguments
  ): void {
    response.body = {
      targets: [
        {
          label: "item 10",
          sortText: "10",
        },
        {
          label: "item 1",
          sortText: "01",
          detail: "detail 1",
        },
        {
          label: "item 2",
          sortText: "02",
          detail: "detail 2",
        },
        {
          label: "array[]",
          selectionStart: 6,
          sortText: "03",
        },
        {
          label: "func(arg)",
          selectionStart: 5,
          selectionLength: 3,
          sortText: "04",
        },
      ],
    };
    this.sendResponse(response);
  }

  protected cancelRequest(
    response: DebugProtocol.CancelResponse,
    args: DebugProtocol.CancelArguments
  ) {
    if (args.requestId) {
      this._cancellationTokens.set(args.requestId, true);
    }
  }

  protected setInstructionBreakpointsRequest(
    response: DebugProtocol.SetInstructionBreakpointsResponse,
    args: DebugProtocol.SetInstructionBreakpointsArguments
  ) {
    // clear all instruction breakpoints
    // this._system.clearInstructionBreakpoints();

    // // set instruction breakpoints
    // const breakpoints = args.breakpoints.map((ibp) => {
    //   const address = parseInt(ibp.instructionReference);
    //   const offset = ibp.offset || 0;
    //   return <DebugProtocol.Breakpoint>{
    //     verified: this._system.setInstructionBreakpoint(address + offset),
    //   };
    // });

    // response.body = {
    //   breakpoints: breakpoints,
    // };
    this.sendResponse(response);
  }

  protected customRequest(
    command: string,
    response: DebugProtocol.Response,
    args: any
  ) {
    if (command === "toggleFormatting") {
      this._valuesInHex = !this._valuesInHex;
      if (this._useInvalidatedEvent) {
        this.sendEvent(new InvalidatedEvent(["variables"]));
      }
      this.sendResponse(response);
    } else {
      super.customRequest(command, response, args);
    }
  }

  //---- helpers
  private convertFromRuntime(v: Register): DebugProtocol.Variable {
    let dapVariable: DebugProtocol.Variable = {
      name: v.name,
      value: v.toString(),
      type: "string",
      variablesReference: 0,
      evaluateName: "$" + v.name,
    };

    return dapVariable;
  }

  private normalizePathAndCasing(path: string) {
    if (process.platform === "win32") {
      return path.replace(/\//g, "\\").toLowerCase();
    } else {
      return path.replace(/\\/g, "/");
    }
  }
  private createSource(filePath: string): Source {
    return new Source(
      basename(filePath),
      this.convertDebuggerPathToClient(filePath),
      undefined,
      undefined,
      "mock-adapter-data"
    );
  }

  private preparePCMapping(dbgFile: string): void {
    const files: Map<number, { file: string }> = new Map();
    const segments: Map<number, { name: string; start: number }> = new Map();
    const lines: Map<number, { file: number; line: number; span?: number }> =
      new Map();
    const spans: Map<number, { segment: number; start: number; size: number }> =
      new Map();

    dbgFile.split("\n").forEach((line) => {
      const entry = line.split("\t");
      if (entry.length !== 2) {
        return;
      }
      const args = entry[1].split(",");
      const argObj: any = {};
      args.forEach((arg) => {
        const [key, value] = arg.split("=");
        argObj[key] = value;
      });

      if (entry[0] === "file") {
        files.set(parseInt(argObj.id), {
          file: argObj.name.replaceAll('"', ""),
        });
      }
      if (entry[0] === "seg") {
        segments.set(parseInt(argObj.id), {
          name: argObj.name,
          start: parseInt(argObj.start, 16),
        });
      }
      if (entry[0] === "line") {
        lines.set(parseInt(argObj.id), {
          file: parseInt(argObj.file),
          line: parseInt(argObj.line),
          span: argObj.span ? parseInt(argObj.span) : undefined,
        });
      }
      if (entry[0] === "span") {
        spans.set(parseInt(argObj.id), {
          segment: parseInt(argObj.seg),
          start: parseInt(argObj.start),
          size: parseInt(argObj.size),
        });
      }
      if (entry[0] === "sym") {
        this._symbolNameTable.set(parseInt(argObj.val, 16), argObj.name);
      }
    });

    lines.forEach((line, id) => {
      if (line.span === undefined) {
        return;
      }
      const span = spans.get(line.span);
      if (!span) {
        return;
      }
      const segment = segments.get(span.segment);

      if (!segment) {
        return;
      }

      const file = files.get(line.file);

      if (!file) {
        return;
      }

      this._pcToFileLine.set(segment.start + span.start, {
        file: this._workspacePath + "/" + file.file,
        line: line.line,
      });
    });
  }
}
