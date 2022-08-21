/* eslint-disable @typescript-eslint/naming-convention */
import { randomInt } from "crypto";
import { log } from "./Logger";
import { System } from "./System";
import { join, low, bank, high } from "./Utils";

const EMPTY_STATUS_REGISTER: CPUPRegister = {
  N: false,
  C: false,
  Z: true,
  M: true,
  X: true,
  I: true,
  V: false,
};

export type CPUPRegister = {
  N: boolean; // Negative
  V: boolean; // Overflow
  C: boolean; // Carry
  Z: boolean; // Zero
  M: boolean; // A register size: false=16bit true=8bit
  X: boolean; // index register size: false=16bit true=8bit
  I: boolean; // Interrupt disable
};

export class CPU {
  private system: System;
  cycles: number = 0;
  PC: Register = new Register("PC", this, false, { size: 4, value: 0xfffc });
  PBR: Register = new Register("PBR", this, false);
  DP: Register = new Register("DP", this, false);
  A: Register = new Register("A", this, true);
  X: Register = new Register("X", this, true);
  Y: Register = new Register("Y", this, true);
  S: Register = new Register("S", this, false, {
    size: 4,
    value: 0x0100 + randomInt(0, 255),
  });

  // Processor register
  P: CPUPRegister = EMPTY_STATUS_REGISTER;

  // Emulation mode
  E: boolean = false;

  callTrace: { entry: number; exit?: number }[] = [];

  public constructor(system: System) {
    this.system = system;
  }

  public changed() {
    this.system.changed();
  }

  public reset() {
    this.cycles = 0;
    this.PBR.reset();
    this.DP.reset();
    this.PC.reset();
    this.E = true;
    this.P = EMPTY_STATUS_REGISTER;
    this.A.reset();
    this.X.reset();
    this.Y.reset();
    this.cycles += 7;
    const resetVector = this.system.readWord(this.PC.word);
    this.PC.setWord(resetVector);
    this.callTrace.push({ entry: resetVector });
  }

  public step(steps: number = 1) {
    for (var step = 0; step < steps; step++) {
      this.system.ram.clearAccess();
      const opcode = this.system.read(this.PC.word);
      log.debug(
        `Read opcode from: ${this.PC.toString()}: ${opcode.toString(16)}`
      );

      this.incProgramCounter(1);
      // prettier-ignore
      // eslint-disable-next-line no-lone-blocks
      {
        switch (opcode) {
          case 0x18: this.Op_clc(); break;
          case 0x20: this.Op_jsr(this.Am_absl()); break;
          case 0x38: this.Op_sec(); break;
          case 0x60: this.Op_rts(); break;
          case 0x69: this.Op_adc(this.Am_immm()); break;
          case 0x4c: this.Op_jmp(this.Am_immb()); break;
          case 0x85: this.Op_sta(this.Am_dpag()); break;
          case 0xa0: this.Op_ldy(this.Am_immm()); break;
          case 0xa2: this.Op_ldx(this.Am_immm()); break;
          case 0xa4: this.Op_ldy(this.Am_dpag()); break;
          case 0xa5: this.Op_lda(this.Am_dpag()); break;
          case 0xa6: this.Op_ldx(this.Am_dpag()); break;
          case 0xa9: this.Op_lda(this.Am_immm()); break;
          case 0xc2: this.Op_rep(this.Am_immb()); break;
          case 0xe2: this.Op_sep(this.Am_immb()); break;
          case 0xfb: this.Op_xce(); break;
        }
      }
    }
    this.changed();
  }

  public setNZ(b: Byte) {
    this.P.Z = b === 0;
    this.SetN(b & 0x80);
  }

  public setNZWord(w: Word) {
    this.P.Z = w === 0;
    this.SetN(w & 0x8000);
  }

  // Stack
  private pushByte(b: Byte) {
    this.system.write(this.S.word, b);
    if (this.E) {
      let newSL = this.S.word - 1;
      if (this.S.byte === 0) {
        newSL = 0xff;
      }
      this.S.setWord(join(newSL, high(this.S.word)));
    } else {
      this.S.setWord(this.S.word - 1);
    }
  }
  private pushWord(w: Word) {
    this.pushByte(high(w));
    this.pushByte(low(w));
  }
  private pullByte() {
    if (this.E) {
      let newSL = this.S.word + 1;
      if (this.S.byte === 0xff) {
        newSL = 0x00;
      }
      this.S.setWord(join(newSL, high(this.S.word)));
    } else {
      this.S.setWord(this.S.word + 1);
    }
    return this.system.read(this.S.word);
  }
  private pullWord() {
    const l = this.pullByte();
    const h = this.pullByte();

    return join(l, h);
  }

  private incProgramCounter(num: number) {
    // TODO: Support overflow of PC
    this.PC.setWord(this.PC.word + num);
  }

  private Op_rts() {
    this.callTrace.pop();
    this.callTrace[this.callTrace.length - 1].exit = undefined;
    this.PC.setWord(this.pullWord() + 1);
    this.cycles += 6;
  }

  private Op_jsr(addr: Address) {
    this.callTrace[this.callTrace.length - 1].exit = this.PC.word - 3;
    this.callTrace.push({ entry: addr });
    this.pushWord(this.PC.word - 1);
    this.PC.setWord(addr);
    this.cycles += 4;
  }

  private Op_adc(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      const result = this.A.byte + n + (this.P.C ? 1 : 0);
      this.SetC(result & 0x100);
      this.SetV((~(this.A.byte ^ n) & (this.A.byte ^ result) & 0x80) > 0);
      this.A.setByte(result);
    } else {
      const n = this.system.read(addr);
      const result = this.A.byte + n + (this.P.C ? 1 : 0);
      this.SetC(result & 0x10000);
      this.SetV((~(this.A.byte ^ n) & (this.A.byte ^ result) & 0x8000) > 0);
      this.A.setWord(result);
    }
  }

  private Op_lda(addr: Address) {
    if (this.E || this.P.M) {
      this.A.setByte(this.system.read(addr));
      this.cycles += 2;
    } else {
      this.A.setWord(this.system.readWord(addr));
      this.cycles += 3;
    }
  }
  private Op_sta(addr: Address) {
    if (this.E || this.P.M) {
      this.system.write(addr, this.A.byte);
      this.cycles += 2;
    } else {
      this.system.writeWord(addr, this.A.word);
      this.cycles += 3;
    }
  }

  private Op_ldy(addr: Address) {
    if (this.E || this.P.I) {
      this.Y.setByte(this.system.read(addr));
      this.cycles += 2;
    } else {
      this.Y.setWord(this.system.readWord(addr));
      this.cycles += 3;
    }
  }

  private Op_ldx(addr: Address) {
    if (this.E || this.P.I) {
      this.X.setByte(this.system.read(addr));
      this.cycles += 2;
    } else {
      this.X.setWord(this.system.readWord(addr));
      this.cycles += 3;
    }
  }

  private Op_xce() {
    const tmpC = this.P.C;
    this.P.C = this.E;
    this.E = tmpC;
    this.DP.setByte(0);
    // TODO: What happens to registers when switching off emulation?
    this.cycles += 2;
  }
  private Op_clc() {
    this.SetC(0);
    this.cycles += 2;
  }
  private Op_sec() {
    this.SetC(1);
    this.cycles += 2;
  }

  private Op_sep(addr: Address) {
    const b = this.system.read(addr);
    // TODO: Set b register as byte
    if (this.E) {
      this.P.M = true;
      this.P.X = true;
    } else {
      if (b & 0x20) {
        this.P.M = true;
      }
      if (b & 0x30) {
        this.P.X = true;
      }
    }
    if (this.P.X) {
      this.X.setWord(join(this.X.byte, 0));
      this.Y.setWord(join(this.Y.byte, 0));
    }
    this.cycles += 3;
  }
  private Op_rep(addr: Address) {
    const b = this.system.read(addr);
    // TODO: Set b register as byte
    if (this.E) {
      this.P.M = true;
      this.P.X = true;
    } else {
      if (b & 0x20) {
        this.P.M = false;
      }
      if (b & 0x30) {
        this.P.X = false;
      }
    }
    this.cycles += 3;
  }

  private Op_jmp(ad: Address) {
    this.PC.setWord(this.system.readWord(ad));
    this.cycles += 3;
  }

  // Immidiate based on size of A
  private Am_immm(): Address {
    const addr = this.PC.word;
    const size = this.E || this.P.M ? 1 : 2;
    this.incProgramCounter(size);
    this.cycles += size - 1;
    return addr;
  }

  // Immidiate byte
  private Am_immb(): Address {
    const addr = bank(this.PBR.byte) | this.PC.word;
    this.incProgramCounter(1);
    this.cycles += 0;
    return addr;
  }

  // Absolute
  private Am_absl(): Address {
    const addr = this.system.readWord(bank(this.PBR.byte) | this.PC.word);
    this.incProgramCounter(2);
    this.cycles += 2;
    return addr;
  }

  // Direct Page
  private Am_dpag(): Address {
    const offset = this.system.read(bank(this.PBR.byte) | this.PC.word);
    this.incProgramCounter(1);
    this.cycles += 1;
    return this.DP.byte + offset;
  }

  private SetC(n: number) {
    this.P.C = n !== 0;
  }
  private SetV(v: boolean) {
    this.P.V = v;
  }
  private SetN(n: number) {
    this.P.N = n !== 0;
  }
}

export class Register {
  public byte: Byte;
  public word: Word;
  public size: 2 | 4 = 2;

  public constructor(
    public name: string,
    private cpu: CPU,
    private updatesPRegister: boolean,
    private initialValue?: { size: 2; value: Byte } | { size: 4; value: Word }
  ) {
    this.byte = 0;
    this.word = 0;
    this.size = initialValue?.size || 2;
    this.reset();
  }

  public reset() {
    this.byte =
      this.initialValue?.size === 2
        ? this.initialValue.value
        : this.initialValue?.size === 4
        ? low(this.initialValue.value)
        : 0;
    this.word =
      this.initialValue?.size === 2
        ? join(this.initialValue.value, 0)
        : this.initialValue?.size === 4
        ? this.initialValue.value
        : 0;
  }
  public setByte(b: Byte) {
    // TODO: Over/underflow handled here? or on every use?
    b = b & 0xff;
    this.byte = b;
    this.word = join(b, 0);
    if (this.updatesPRegister) {
      this.cpu.setNZ(b);
    }
  }
  public setWord(w: Word) {
    w = w & 0xffff;
    this.word = w;
    this.byte = low(w);
    if (this.updatesPRegister) {
      this.cpu.setNZWord(w);
    }
  }

  public toString() {
    return this.size === 4
      ? this.word.toString(16).padStart(4, "0")
      : this.byte.toString(16).padStart(2, "0");
  }
}
