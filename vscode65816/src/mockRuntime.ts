/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

export interface FileAccessor {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, contents: Uint8Array): Promise<void>;
}

export interface IRuntimeBreakpoint {
  id: number;
  line: number;
  verified: boolean;
}

export type IRuntimeVariableType =
  | number
  | boolean
  | string
  | RuntimeVariable[];

export class RuntimeVariable {
  private _memory?: Uint8Array;

  public reference?: number;

  public get value() {
    return this._value;
  }

  public set value(value: IRuntimeVariableType) {
    this._value = value;
    this._memory = undefined;
  }

  public get memory() {
    if (this._memory === undefined && typeof this._value === "string") {
      this._memory = new TextEncoder().encode(this._value);
    }
    return this._memory;
  }

  constructor(
    public readonly name: string,
    private _value: IRuntimeVariableType
  ) {}

  public setMemory(data: Uint8Array, offset = 0) {
    const memory = this.memory;
    if (!memory) {
      return;
    }

    memory.set(data, offset);
    this._memory = memory;
    this._value = new TextDecoder().decode(memory);
  }
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
