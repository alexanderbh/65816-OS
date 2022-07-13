import { log } from "./Logger";
import { System } from "./System";
import { join, low, addr, bank } from "./Utils";

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
  PC: Address = 0xfffc;
  PBR: Byte = 0;
  DP: Byte = 0;
  A: Register = new Register(this);
  X: Register = new Register(this);
  Y: Register = new Register(this);

  // Processor register
  P: CPUPRegister = EMPTY_STATUS_REGISTER;

  // Emulation mode
  E: boolean = false;

  public constructor(system: System) {
    this.system = system;
  }

  public changed() {
    this.system.changed();
  }

  public reset() {
    this.cycles = 0;
    this.PBR = 0;
    this.DP = 0;
    this.PC = 0xfffc;
    this.E = true;
    this.P = EMPTY_STATUS_REGISTER;
    this.A = new Register(this);
    this.X = new Register(this);
    this.Y = new Register(this);
    this.cycles += 7;
    const resetVector = this.system.readWord(this.PC);
    this.PC = addr(resetVector);
  }

  public step(steps: number = 1) {
    for (var step = 0; step < steps; step++) {
      this.system.ram.clearAccess();
      const opcode = this.system.read(this.PC);
      log.debug(
        `Read opcode from: ${this.PC.toString(16)}: ${opcode.toString(16)}`
      );

      this.incProgramCounter(1);
      // prettier-ignore
      // eslint-disable-next-line no-lone-blocks
      {
        switch (opcode) {
          case 0x18: this.Op_clc(); break;
          case 0x38: this.Op_sec(); break;
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

  private incProgramCounter(num: number) {
    this.PC += num;
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
    this.DP = 0;
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
    this.PC = addr(this.system.readWord(ad));
    this.cycles += 3;
  }

  // Immidiate based on size of A
  private Am_immm(): Address {
    const addr = this.PC;
    const size = this.E || this.P.M ? 1 : 2;
    this.incProgramCounter(size);
    this.cycles += size - 1;
    return addr;
  }

  // Immidiate byte
  private Am_immb(): Address {
    const addr = bank(this.PBR) | this.PC;
    this.incProgramCounter(1);
    this.cycles += 0;
    return addr;
  }

  // Direct Page
  private Am_dpag(): Address {
    const offset = this.system.read(bank(this.PBR) | this.PC);
    this.incProgramCounter(1);
    this.cycles += 1;
    return this.DP + offset;
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

class Register {
  private cpu: CPU;
  public byte: Byte;
  public word: Word;

  public constructor(cpu: CPU) {
    this.cpu = cpu;
    this.byte = 0;
    this.word = 0;
  }
  public setByte(b: Byte) {
    b = b & 0xff;
    this.byte = b;
    this.word = join(b, 0);
    this.cpu.setNZ(b);
  }
  public setWord(w: Word) {
    w = w & 0xffff;
    this.word = w;
    this.byte = low(w);
    this.cpu.setNZWord(w);
  }

  public toString() {
    return this.word.toString(16).padStart(4, "0");
  }
}
