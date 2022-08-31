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
import { ROM } from "./lib/ROM";
import { basename } from "path";
import { addr } from "./lib/Utils";
import { Register } from "./lib/Register";

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
    | "locals"
    | "registers"
    | "emulator"
    | "p"
    | "stack"
    | "via1"
    | RuntimeVariable
  >();
  private _pVariableHandle = this._variableHandles.create("p");
  private _stackVarReference = this._variableHandles.create("stack");

  private _configurationDone = new Subject();

  private _useInvalidatedEvent = false;
  private _sourceFile?: string;

  private _pcToFileLine: Map<
    number,
    { file: string; line: number; type?: number }
  > = new Map();
  private _pcToSpan: Map<number, { size: number }> = new Map();

  private _fileLineToPc: Map<string, Map<number, number[]>> = new Map();
  private _symbolToAddress: Map<string, { addr: Address; size: number }> =
    new Map();

  private _breakpointRequests: DebugProtocol.SetBreakpointsArguments[] = [];
  private breakpointId = 0;
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
    this._system.on("memoryChanged", () => {
      this.sendEvent(
        new InvalidatedEvent(["variables"], MockDebugSession.threadID)
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
    response.body.supportsCancelRequest = false;

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
    response.body.supportsInstructionBreakpoints = false;

    // make VS Code able to read and write variable memory
    response.body.supportsReadMemoryRequest = true;
    response.body.supportsWriteMemoryRequest = true;

    response.body.supportSuspendDebuggee = true;
    response.body.supportTerminateDebuggee = true;
    response.body.supportsFunctionBreakpoints = false;

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

    // prepare PC map
    const dgbFileContent = await this.fileAccessor.readFile(
      this.normalizePathAndCasing(args.program.replace(".bin", ".dbg"))
    );
    const dgbFile = dgbFileContent.toString();
    this.preparePCMapping(dgbFile);

    this.setBreakpoints();

    // wait 1 second until configuration has finished (and configurationDoneRequest has been called)
    await this._configurationDone.wait(1000);

    // Load binary
    this._sourceFile = this.normalizePathAndCasing(args.program);
    // start the program in the runtime
    const rom = new ROM(
      await this.fileAccessor.readFile(this._sourceFile),
      0x4000
    );
    this._system.start(rom, !args.noDebug, !!args.stopOnEntry, this._pcToSpan);

    this.sendResponse(response);
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
    if (args.source.path && args.breakpoints) {
      this._breakpointRequests.push(args);
      response.body = {
        breakpoints: args.breakpoints.map((b) => ({
          verified: true,
          line: b.line,
          id: this.breakpointId++,
        })),
      };
    } else {
      response.body = {
        breakpoints: [],
      };
    }

    if (this._fileLineToPc.size > 0) {
      this.setBreakpoints();
    }

    this.sendResponse(response);
  }

  protected breakpointLocationsRequest(
    response: DebugProtocol.BreakpointLocationsResponse,
    args: DebugProtocol.BreakpointLocationsArguments,
    request?: DebugProtocol.Request
  ): void {
    if (args.source.path) {
      response.body = {
        breakpoints: Array.from(this._system.breakpoints)
          .filter((p) => this._pcToFileLine.get(p)?.file === args.source.path)
          .map((pc) => {
            const fileLine = this._pcToFileLine.get(pc);
            if (!fileLine) {
              return undefined;
            }
            return {
              line: fileLine.line,
              column: 0,
            };
          })
          .filter((p) => p) as DebugProtocol.BreakpointLocation[],
      };
    } else {
      response.body = {
        breakpoints: [],
      };
    }

    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [new Thread(MockDebugSession.threadID, "65C816")],
    };
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments
  ): void {
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
    _args: DebugProtocol.ScopesArguments
  ): void {
    response.body = {
      scopes: [
        new Scope(
          "Registers",
          this._variableHandles.create("registers"),
          false
        ),
        new Scope("Emulator", this._variableHandles.create("emulator"), false),
        // new Scope("Locals", this._variableHandles.create("locals"), false),
        new Scope("Stack", this._stackVarReference, false),
        new Scope("VIA1", this._variableHandles.create("via1"), false),
      ],
    };
    this.sendResponse(response);
  }

  protected async writeMemoryRequest(
    response: DebugProtocol.WriteMemoryResponse,
    { data, memoryReference, offset = 0 }: DebugProtocol.WriteMemoryArguments
  ) {
    if (memoryReference === "stack") {
      const decoded = base64.toByteArray(data);
      this._system.writeSlice(offset, decoded);
      response.body = { bytesWritten: decoded.length };
    } else {
      response.body = { bytesWritten: 0 };
    }

    this.sendResponse(response);
  }

  protected async readMemoryRequest(
    response: DebugProtocol.ReadMemoryResponse,
    { offset = 0, count, memoryReference }: DebugProtocol.ReadMemoryArguments
  ) {
    if (memoryReference === "stack") {
      const data = this._system.readSlice(offset, count);
      response.body = {
        data: base64.fromByteArray(data),
        address: "" + offset,
        unreadableBytes: count - data.length,
      };
    }

    this.sendResponse(response);
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
    request?: DebugProtocol.Request
  ): Promise<void> {
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
        this._system.cpu.DP,
        this._system.cpu.PBR,
        this._system.cpu.DBR,
      ];
      const p = this._system.cpu.P;
      response.body = {
        variables: vs
          .map((vr) => this.convertFromRuntime(vr))
          .concat([
            {
              name: "P",
              variablesReference: this._pVariableHandle,
              value: [p.N, p.C, p.Z, p.M, p.X, p.I, p.V]
                .map((vl) => (vl ? "1" : "0"))
                .join(""),
            },
          ]),
      };
    } else if (v === "p") {
      const p = this._system.cpu.P;
      response.body = {
        variables: [
          { name: "N", value: p.N ? "1" : "0", variablesReference: 0 },
          { name: "C", value: p.C ? "1" : "0", variablesReference: 0 },
          { name: "Z", value: p.Z ? "1" : "0", variablesReference: 0 },
          { name: "M", value: p.M ? "1" : "0", variablesReference: 0 },
          { name: "X", value: p.X ? "1" : "0", variablesReference: 0 },
          { name: "I", value: p.I ? "1" : "0", variablesReference: 0 },
          { name: "V", value: p.V ? "1" : "0", variablesReference: 0 },
        ],
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
    } else if (v === "stack") {
      const last8 = this._system.readSlice(
        addr(0, this._system.cpu.S.word) + 1,
        16
      );
      response.body = {
        variables: [
          {
            name: "Stack",
            value: Array.from(last8)
              .map((p) => p.toString(16).padStart(2, "0"))
              .join(","),
            memoryReference: "stack",
            variablesReference: 0,
          },
        ],
      };
    } else if (v === "via1") {
      response.body = {
        variables: [
          {
            name: "Timer1",
            value: (this._system.via1.timer1 || "N/A").toString(),
            variablesReference: 0,
          },
          ...this._system.via1.registers.map((r) =>
            this.convertFromRuntime(r, "$binary ($hex)")
          ),
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
      if (args.name === "A") {
        this._system.cpu.A.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.A);
      } else if (args.name === "Y") {
        this._system.cpu.Y.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.Y);
      } else if (args.name === "X") {
        this._system.cpu.X.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.X);
      } else if (args.name === "PC") {
        this._system.cpu.PC.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.PC);
      } else if (args.name === "S") {
        this._system.cpu.S.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.S);
      } else if (args.name === "DP") {
        this._system.cpu.DP.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.DP);
      } else if (args.name === "PBR") {
        this._system.cpu.PBR.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.PBR);
      } else if (args.name === "DBR") {
        this._system.cpu.DBR.setWord(parseInt(args.value, 16));
        response.body = this.convertFromRuntime(this._system.cpu.DBR);
      }
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

  protected sourceRequest(
    response: DebugProtocol.SourceResponse,
    args: DebugProtocol.SourceArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this.sendResponse(response);
  }
  protected evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    if (this._symbolToAddress.has(args.expression)) {
      const symbolData = this._symbolToAddress.get(args.expression)!;
      const value = this._system.readSlice(symbolData.addr, symbolData.size);
      response.body = {
        result: "0x" + Buffer.from(value.reverse()).toString("hex"),
        variablesReference: 0,
      };
    }
    this.sendResponse(response);
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments
  ): void {
    this._system.stepOver();
    this.sendResponse(response);
  }

  protected stepBackRequest(
    response: DebugProtocol.StepBackResponse,
    args: DebugProtocol.StepBackArguments
  ): void {
    // this._system.step();
    this.sendResponse(response);
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments
  ): void {
    this._system.step();
    this.sendResponse(response);
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments
  ): void {
    this._system.stepOut();
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

  //---- helpers
  private convertFromRuntime(
    v: Register,
    format: string = "$hex"
  ): DebugProtocol.Variable {
    let dapVariable: DebugProtocol.Variable = {
      name: v.name,
      value: format
        .replace("$hex", "0x" + v.toString().toUpperCase())
        .replace("$binary", v.toString(2).padStart(8, "0")),
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
    const lines: {
      file: number;
      line: number;
      span?: number;
      type?: number;
    }[] = [];
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
        if (argObj.span) {
          const spans = argObj.span.replace("'", "").split("+");
          spans.forEach((span) => {
            lines.push({
              file: parseInt(argObj.file),
              line: parseInt(argObj.line),
              span: span ? parseInt(span) : undefined,
              type: argObj.type ? parseInt(argObj.type) : undefined,
            });
          });
        }
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
        this._symbolToAddress.set(argObj.name.replaceAll('"', ""), {
          addr: parseInt(argObj.val, 16),
          size: parseInt(argObj.size),
        });
      }
    });

    files.forEach((file) => {
      this._fileLineToPc.set(
        this.normalizePathAndCasing(this._workspacePath + "/" + file.file),
        new Map()
      );
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

      const pc = segment.start + span.start;
      if (
        this._fileLineToPc
          .get(
            this.normalizePathAndCasing(this._workspacePath + "/" + file.file)
          )
          ?.has(line.line)
      ) {
        this._fileLineToPc
          .get(
            this.normalizePathAndCasing(this._workspacePath + "/" + file.file)
          )
          ?.set(line.line, [
            pc,
            ...this._fileLineToPc
              .get(
                this.normalizePathAndCasing(
                  this._workspacePath + "/" + file.file
                )
              )!
              .get(line.line)!,
          ]);
      }
      this._fileLineToPc
        .get(this.normalizePathAndCasing(this._workspacePath + "/" + file.file))
        ?.set(line.line, [pc]);

      if (!this._pcToFileLine.has(pc) || line.type === 2) {
        this._pcToFileLine.set(pc, {
          file: this.normalizePathAndCasing(
            this._workspacePath + "/" + file.file
          ),
          line: line.line,
          type: line.type,
        });
      }

      this._pcToSpan.set(pc, { size: span.size });
    });
  }

  private setBreakpoints() {
    this._breakpointRequests.forEach((args) => {
      if (args.source.path) {
        const existing = Array.from(this._system.breakpoints).filter(
          (b) =>
            this._pcToFileLine.get(b)?.file ===
            this.normalizePathAndCasing(args.source.path!)
        );
        existing.forEach((e) => this._system.breakpoints.delete(e));
      }

      args.breakpoints?.forEach((b, index) => {
        const pc = this._fileLineToPc
          .get(this.normalizePathAndCasing(args.source.path!))
          ?.get(b.line);
        if (!pc) {
          console.log("Not found pc", args.source.path, b.line);
        } else {
          pc.forEach((p) => {
            this._system.breakpoints.add(p);
          });
          //this.sendEvent(
          //  new BreakpointEvent("changed", { verified: true, id: index })
          //);
        }
      });
    });
    this._breakpointRequests = [];
  }
}
