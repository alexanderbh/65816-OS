/* eslint-disable @typescript-eslint/naming-convention */
import { randomInt } from "crypto";
import { System } from "./System";
import { join, low, bank, high, addr, word, toSigned } from "./Utils";

const EMPTY_STATUS_REGISTER: CPUPRegister = {
  N: false,
  C: false,
  Z: true,
  M: true,
  D: false,
  X: true,
  I: true,
  V: false,
  B: false,
};

export type CPUPRegister = {
  N: boolean; // Negative
  V: boolean; // Overflow
  C: boolean; // Carry
  D: boolean; // Decimal Mode
  Z: boolean; // Zero
  M: boolean; // A register size: false=16bit true=8bit
  X: boolean; // index register size: false=16bit true=8bit
  I: boolean; // Interrupt disable
  B: boolean; // Break
};

export class CPU {
  private system: System;
  cycles: number = 0;
  PC: Register = new Register("PC", this, false, { size: 4, value: 0xfffc });
  PBR: Register = new Register("PBR", this, false);
  DBR: Register = new Register("DBR", this, false);
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
  private StatusRegister(): Byte {
    let result = 0;
    if (this.P.C) {
      result |= 1 << 0;
    }
    if (this.P.Z) {
      result |= 1 << 1;
    }
    if (this.P.I) {
      result |= 1 << 2;
    }
    if (this.P.D) {
      result |= 1 << 3;
    }
    if (this.P.X) {
      result |= 1 << 4;
    }
    if (this.P.M) {
      result |= 1 << 5;
    }
    if (this.P.V) {
      result |= 1 << 6;
    }
    if (this.P.N) {
      result |= 1 << 7;
    }
    return result;
  }

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
    this.DBR.reset();
    this.DP.reset();
    this.PC.reset();
    this.E = true;
    this.P = EMPTY_STATUS_REGISTER;
    this.A.reset();
    this.X.reset();
    this.Y.reset();
    this.cycles += 7;
    const resetVector = this.system.readWord(addr(0, this.PC.word));
    this.PC.setWord(resetVector);
    this.callTrace.push({ entry: resetVector });
  }

  public step(steps: number = 1): Byte {
    let opcode: Byte = 0;
    for (var step = 0; step < steps; step++) {
      this.system.ram.clearAccess();
      opcode = this.system.read(bank(this.PBR.byte) | this.PC.word);

      this.incProgramCounter(1);

      // prettier-ignore
      // eslint-disable-next-line no-lone-blocks
      {
        switch (opcode) {
          case 0x18: this.Op_clc(); break;
          case 0x20: this.Op_jsr(this.Am_absl2()); break;
          case 0x38: this.Op_sec(); break;
          case 0x60: this.Op_rts(); break;
          case 0x69: this.Op_adc(this.Am_immm()); break;
          case 0x4c: this.Op_jmp(this.Am_absl2()); break;
          case 0x85: this.Op_sta(this.Am_dpag()); break;
          case 0x8d: this.Op_sta(this.Am_absl()); break;

          case 0xa0: this.Op_ldy(this.Am_immm()); break;
          case 0xa2: this.Op_ldx(this.Am_immm()); break;
          case 0xa4: this.Op_ldy(this.Am_dpag()); break;
          case 0xa5: this.Op_lda(this.Am_dpag()); break;
          case 0xa6: this.Op_ldx(this.Am_dpag()); break;
          case 0xa9: this.Op_lda(this.Am_immm()); break;
          case 0xad: this.Op_lda(this.Am_absl()); break;
          case 0xae: this.Op_ldx(this.Am_absl()); break;
          case 0xac: this.Op_ldy(this.Am_absl()); break;

          case 0xc2: this.Op_rep(this.Am_immb()); break;
          case 0xe2: this.Op_sep(this.Am_immb()); break;
          case 0xfb: this.Op_xce(); break;
          default: throw new Error(`Unknown opcode: ${opcode}`);
        }
      }
    }
    this.changed();
    return opcode;
  }

  // Stack
  private pushByte(b: Byte) {
    this.system.write(addr(0, this.S.word), b);
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
    return this.system.read(addr(0, this.S.word));
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

  private Op_adc(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      const result = this.A.byte + n + (this.P.C ? 1 : 0);
      this.SetC(result & 0x100);
      this.SetV((~(this.A.byte ^ n) & (this.A.byte ^ result) & 0x80) !== 0);
      this.A.setByte(result);
      this.cycles += 2;
    } else {
      const n = this.system.read(addr);
      const result = this.A.byte + n + (this.P.C ? 1 : 0);
      this.SetC(result & 0x10000);
      this.SetV((~(this.A.byte ^ n) & (this.A.byte ^ result) & 0x8000) !== 0);
      this.A.setWord(result);
      this.cycles += 2;
    }
  }
  private Op_and(addr: Address) {
    if (this.E) {
      const n = this.system.read(addr);
      this.A.setByte(this.A.byte & n);
      this.cycles += 2;
    } else {
      const n = this.system.readWord(addr);
      this.A.setWord(this.A.word & n);
      this.cycles += 3;
    }
  }

  private Op_asl(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      this.SetC(n & 0x80);
      this.setNZ(n << 1);
      this.system.write(addr, n << 1);
      this.cycles += 4;
    } else {
      const n = this.system.readWord(addr);
      this.SetC(n & 0x8000);
      this.setNZWord(n << 1);
      this.system.writeWord(addr, n << 1);
      this.cycles += 5;
    }
  }

  private Op_asla(addr: Address) {
    if (this.E || this.P.M) {
      this.SetC(this.A.byte & 0x80);
      this.A.setByte(this.A.byte << 1);
    } else {
      this.SetC(this.A.word & 0x8000);
      this.A.setWord(this.A.word << 1);
    }
    this.cycles += 2;
  }

  private Op_bcc(addr: Address) {
    if (!this.P.C) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bcs(addr: Address) {
    if (this.P.C) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_beq(addr: Address) {
    if (this.P.Z) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bit(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      this.SetZ(this.A.byte & n);
      this.SetN(n & 0x80);
      this.SetV((n & 0x40) !== 0);
      this.cycles += 2;
    } else {
      const n = this.system.readWord(addr);
      this.SetZ(this.A.word & n);
      this.SetN(n & 0x8000);
      this.SetV((n & 0x4000) !== 0);
      this.cycles += 3;
    }
  }

  private Op_biti(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      this.SetZ(this.A.byte & n);
    } else {
      const n = this.system.readWord(addr);
      this.SetZ(this.A.word & n);
    }
    this.cycles += 2;
  }

  private Op_bmi(addr: Address) {
    if (this.P.N) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bne(addr: Address) {
    if (!this.P.Z) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bpl(addr: Address) {
    if (!this.P.N) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bra(addr: Address) {
    if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
      this.cycles += 1;
    }
    this.PC.setWord(word(addr));
    this.cycles += 3;
  }

  private Op_brk(addr: Address) {
    if (this.E) {
      this.pushWord(this.PC.word);
      this.pushByte(this.StatusRegister() | 0x10);
      this.P.I = true;
      this.P.D = false;
      this.PBR.setByte(0);
      this.PC.setWord(0xfffe);
      this.cycles += 7;
    } else {
      this.pushByte(this.PBR.byte);
      this.pushWord(this.PC.word);
      this.pushByte(this.StatusRegister());
      this.P.I = true;
      this.P.D = false;
      this.PBR.setByte(0);
      this.PC.setWord(0xffe6);
      this.cycles += 8;
    }
  }

  private Op_brl(addr: Address) {
    this.PC.setWord(word(addr));
    this.cycles += 3;
  }

  private Op_bvc(addr: Address) {
    if (!this.P.V) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_bvs(addr: Address) {
    if (this.P.V) {
      if (this.E && ((this.PC.word ^ addr) & 0xff00) !== 0) {
        this.cycles += 1;
      }
      this.PC.setWord(word(addr));
      this.cycles += 3;
    } else {
      this.cycles += 2;
    }
  }

  private Op_clc() {
    this.SetC(0);
    this.cycles += 2;
  }
  private Op_cld() {
    this.SetD(false);
    this.cycles += 2;
  }
  private Op_cli() {
    this.SetI(false);
    this.cycles += 2;
  }
  private Op_clv() {
    this.SetV(false);
    this.cycles += 2;
  }

  private Op_cmp(addr: Address) {
    if (this.E || this.P.M) {
      const data = this.system.read(addr);
      const temp = this.A.byte - data;

      this.SetC(this.A.byte > data ? 1 : 0);
      this.setNZ(low(temp));
      this.cycles += 2;
    } else {
      const data = this.system.readWord(addr);
      const temp = this.A.word - data;

      this.SetC(this.A.word > data ? 1 : 0);
      this.setNZWord(word(temp));
      this.cycles += 3;
    }
  }

  private Op_cop(addr: Address) {
    if (this.E) {
      this.pushWord(this.PC.word);
      this.pushByte(this.StatusRegister());
      this.P.I = true;
      this.P.D = false;
      this.PBR.setByte(0);
      this.PC.setWord(0xfff4);
      this.cycles += 7;
    } else {
      this.pushByte(this.PBR.byte);
      this.pushWord(this.PC.word);
      this.pushByte(this.StatusRegister());
      this.P.I = true;
      this.P.D = false;
      this.PBR.setByte(0);
      this.PC.setWord(0xffe4);
      this.cycles += 8;
    }
  }

  private Op_cpx(addr: Address) {
    if (this.E || this.P.X) {
      const data = this.system.read(addr);
      const temp = this.X.byte - data;

      this.SetC(this.A.byte > data ? 1 : 0);
      this.setNZ(low(temp));
      this.cycles += 2;
    } else {
      const data = this.system.readWord(addr);
      const temp = this.X.word - data;

      this.SetC(this.A.word > data ? 1 : 0);
      this.setNZWord(word(temp));
      this.cycles += 3;
    }
  }

  private Op_cpy(addr: Address) {
    if (this.E || this.P.X) {
      const data = this.system.read(addr);
      const temp = this.Y.byte - data;

      this.SetC(this.A.byte > data ? 1 : 0);
      this.setNZ(low(temp));
      this.cycles += 2;
    } else {
      const data = this.system.readWord(addr);
      const temp = this.Y.word - data;

      this.SetC(this.A.word > data ? 1 : 0);
      this.setNZWord(word(temp));
      this.cycles += 3;
    }
  }

  private Op_dec(addr: Address) {
    if (this.E || this.P.M) {
      const data = this.system.read(addr) - 1;

      this.system.write(addr, data);
      this.setNZ(data);
      this.cycles += 4;
    } else {
      const data = this.system.readWord(addr) - 1;

      this.system.writeWord(addr, data);
      this.setNZWord(data);
      this.cycles += 5;
    }
  }

  private Op_deca(addr: Address) {
    if (this.E || this.P.M) {
      this.A.setByte(this.A.byte - 1);
    } else {
      this.A.setWord(this.A.word - 1);
    }
    this.cycles += 2;
  }

  private Op_dex(addr: Address) {
    if (this.E || this.P.X) {
      this.X.setByte(this.X.byte - 1);
    } else {
      this.X.setWord(this.X.word - 1);
    }
    this.cycles += 2;
  }

  private Op_dey(addr: Address) {
    if (this.E || this.P.X) {
      this.Y.setByte(this.X.byte - 1);
    } else {
      this.Y.setWord(this.X.word - 1);
    }
    this.cycles += 2;
  }

  private Op_eor(addr: Address) {
    if (this.E || this.P.M) {
      const data = this.system.read(addr);
      this.A.setByte(this.A.byte ^ data);
      this.cycles += 2;
    } else {
      const data = this.system.readWord(addr);
      this.A.setWord(this.A.word ^ data);
      this.cycles += 3;
    }
  }

  private Op_inc(addr: Address) {
    if (this.E || this.P.M) {
      const data = this.system.read(addr) + 1;

      this.system.write(addr, data);
      this.setNZ(data);
      this.cycles += 4;
    } else {
      const data = this.system.readWord(addr) + 1;

      this.system.writeWord(addr, data);
      this.setNZWord(data);
      this.cycles += 5;
    }
  }

  private Op_inca(addr: Address) {
    if (this.E || this.P.M) {
      this.A.setByte(this.A.byte + 1);
    } else {
      this.A.setWord(this.A.word + 1);
    }
    this.cycles += 2;
  }

  private Op_inx(addr: Address) {
    if (this.E || this.P.X) {
      this.X.setByte(this.X.byte + 1);
    } else {
      this.X.setWord(this.X.word + 1);
    }
    this.cycles += 2;
  }

  private Op_iny(addr: Address) {
    if (this.E || this.P.X) {
      this.Y.setByte(this.X.byte + 1);
    } else {
      this.Y.setWord(this.X.word + 1);
    }
    this.cycles += 2;
  }

  private Op_jmp(ea: Address) {
    this.PC.setWord(word(ea));
    this.cycles += 3;
  }

  private Op_jsl(addr: Address) {
    this.callTrace[this.callTrace.length - 1].exit = this.PC.word - 3;
    this.callTrace.push({ entry: addr });
    this.pushByte(this.PBR.byte);
    this.pushWord(this.PC.word - 1);
    this.PBR.setByte(low(addr >> 16));
    this.PC.setWord(word(addr));
    this.cycles += 4;
  }

  private Op_jsr(addr: Address) {
    this.callTrace[this.callTrace.length - 1].exit = this.PC.word - 3;
    this.callTrace.push({ entry: addr });
    this.pushWord(this.PC.word - 1);
    this.PC.setWord(word(addr));
    this.cycles += 4;
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

  private Op_ldx(addr: Address) {
    if (this.E || this.P.I) {
      this.X.setByte(this.system.read(addr));
      this.cycles += 2;
    } else {
      this.X.setWord(this.system.readWord(addr));
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

  private Op_lsr(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      this.SetC(n & 0x01);
      this.setNZ(n >> 1);
      this.system.write(addr, n >> 1);
      this.cycles += 4;
    } else {
      const n = this.system.readWord(addr);
      this.SetC(n & 0x0001);
      this.setNZWord(n >> 1);
      this.system.writeWord(addr, n >> 1);
      this.cycles += 5;
    }
  }

  private Op_lsra(addr: Address) {
    if (this.E || this.P.M) {
      this.SetC(this.A.byte & 0x01);
      this.A.setByte(this.A.byte >> 1);
    } else {
      this.SetC(this.A.word & 0x0001);
      this.A.setWord(this.A.word >> 1);
    }
    this.cycles += 2;
  }

  private Op_mvn(addr: Address) {
    throw new Error("Not implemented: MVN"); // TODO
  }
  private Op_mvp(addr: Address) {
    throw new Error("Not implemented: MVP"); // TODO
  }

  private Op_nop(addr: Address) {
    this.cycles += 2;
  }

  private Op_ora(addr: Address) {
    throw new Error("Not implemented: ORA"); // TODO
  }

  private Op_pea(addr: Address) {
    this.pushWord(this.system.readWord(addr));
    this.cycles += 5;
  }
  private Op_pei(addr: Address) {
    this.pushWord(this.system.readWord(addr));
    this.cycles += 6;
  }
  private Op_per(addr: Address) {
    this.pushWord(word(addr));
    this.cycles += 6;
  }

  private Op_pha(addr: Address) {
    if (this.E || this.P.M) {
      this.pushByte(this.A.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.A.word);
      this.cycles += 4;
    }
  }

  private Op_phb(addr: Address) {
    this.pushByte(this.DBR.byte);
    this.cycles += 3;
  }

  private Op_phd(addr: Address) {
    this.pushWord(this.DP.word);
    this.cycles += 3;
  }
  private Op_phk(addr: Address) {
    this.pushByte(this.PBR.byte);
    this.cycles += 3;
  }
  private Op_php(addr: Address) {
    this.pushByte(this.StatusRegister());
    this.cycles += 3;
  }
  private Op_phx(addr: Address) {
    if (this.E || this.P.X) {
      this.pushByte(this.X.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.X.word);
      this.cycles += 4;
    }
  }
  private Op_phy(addr: Address) {
    if (this.E || this.P.X) {
      this.pushByte(this.Y.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.Y.word);
      this.cycles += 4;
    }
  }
  private Op_pla(addr: Address) {
    if (this.E || this.P.M) {
      this.A.setByte(this.pullByte());
      this.cycles += 4;
    } else {
      this.A.setWord(this.pullWord());
      this.cycles += 5;
    }
  }
  private Op_plb(addr: Address) {
    const b = this.pullByte();
    this.DBR.setByte(b);
    this.setNZ(b);
    this.cycles += 4;
  }
  private Op_pld(addr: Address) {
    const b = this.pullWord();
    this.DP.setWord(b);
    this.setNZWord(b);
    this.cycles += 5;
  }
  private Op_plk(addr: Address) {
    const b = this.pullByte();
    this.PBR.setByte(b);
    this.setNZ(b);
    this.cycles += 4;
  }
  private Op_plp(addr: Address) {
    throw new Error("Not implemented: PLP"); // TODO
  }
  private Op_plx(addr: Address) {
    if (this.E || this.P.X) {
      this.X.setByte(this.pullByte());
      this.cycles += 4;
    } else {
      this.X.setWord(this.pullWord());
      this.cycles += 5;
    }
  }
  private Op_ply(addr: Address) {
    if (this.E || this.P.X) {
      this.Y.setByte(this.pullByte());
      this.cycles += 4;
    } else {
      this.Y.setWord(this.pullWord());
      this.cycles += 5;
    }
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

  private Op_rol(addr: Address) {
    throw new Error("Not implemented: ROL"); // TODO
  }

  private Op_rola(addr: Address) {
    throw new Error("Not implemented: ROLA"); // TODO
  }
  private Op_ror(addr: Address) {
    throw new Error("Not implemented: ROR"); // TODO
  }
  private Op_rora(addr: Address) {
    throw new Error("Not implemented: RORA"); // TODO
  }

  private Op_rti() {
    throw new Error("Not implemented: RTI"); // TODO
  }
  private Op_rtl() {
    this.callTrace.pop();
    this.callTrace[this.callTrace.length - 1].exit = undefined;
    this.PC.setWord(this.pullWord() + 1);
    this.PBR.setByte(this.pullByte());
    this.cycles += 6;
  }

  private Op_rts() {
    this.callTrace.pop();
    this.callTrace[this.callTrace.length - 1].exit = undefined;
    this.PC.setWord(this.pullWord() + 1);
    this.cycles += 6;
  }

  private Op_sbc() {
    throw new Error("Not implemented: SBC"); // TODO
  }

  private Op_sec() {
    this.SetC(1);
    this.cycles += 2;
  }

  private Op_sed() {
    this.SetD(true);
    this.cycles += 2;
  }

  private Op_sei() {
    this.SetI(true);
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

  private Op_sta(addr: Address) {
    if (this.E || this.P.M) {
      this.system.write(addr, this.A.byte);
      this.cycles += 2;
    } else {
      this.system.writeWord(addr, this.A.word);
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

  // Absolute
  private Am_absl(): Address {
    const ea = addr(
      this.DBR.byte,
      this.system.readWord(addr(this.DBR.byte, this.PC.word))
    );
    this.incProgramCounter(2);
    this.cycles += 2;
    return ea;
  }

  // Absolute
  private Am_absl2(): Address {
    const ea = addr(
      this.DBR.byte,
      this.system.readWord(addr(this.PBR.byte, this.PC.word))
    );
    this.incProgramCounter(2);
    this.cycles += 2;
    return ea;
  }

  // Absolute Indexed X - a,X
  private Am_absx(): Address {
    const ea =
      addr(
        this.DBR.byte,
        this.system.readWord(addr(this.PBR.byte, this.PC.word))
      ) + this.X.word;
    this.incProgramCounter(2);
    this.cycles += 2;
    return ea;
  }

  // Absolute Indexed Y - a,Y
  private Am_absy(): Address {
    const ea =
      addr(
        this.DBR.byte,
        this.system.readWord(addr(this.PBR.byte, this.PC.word))
      ) + this.Y.word;
    this.incProgramCounter(2);
    this.cycles += 2;
    return ea;
  }

  // Absolute Indirect - (a)
  private Am_absi(): Address {
    const ea = addr(
      this.PBR.byte,
      this.system.readWord(addr(this.PBR.byte, this.PC.word))
    );
    this.incProgramCounter(2);
    this.cycles += 4;
    return addr(0, this.system.readWord(ea));
  }

  // Absolute Indexed Indirect - (a,X)
  private Am_abxi(): Address {
    const ea =
      addr(0, this.system.readWord(addr(this.PBR.byte, this.PC.word))) +
      this.X.word;
    this.incProgramCounter(2);
    this.cycles += 4;
    return addr(0, this.system.readWord(ea));
  }

  // Absolute Long - >a
  private Am_alng(): Address {
    const ea = this.system.readSesqui(addr(this.PBR.byte, this.PC.word));

    this.incProgramCounter(3);
    this.cycles += 3;
    return ea;
  }
  // Absolute Long Indexed - >a,X
  private Am_alnx(): Address {
    const ea =
      this.system.readSesqui(addr(this.PBR.byte, this.PC.word)) + this.X.word;

    this.incProgramCounter(3);
    this.cycles += 3;
    return ea;
  }

  // Absolute Indirect Long - [a]
  private Am_abil(): Address {
    const ea = addr(0, this.system.readWord(addr(this.PBR.byte, this.PC.word)));
    this.incProgramCounter(2);
    this.cycles += 5;
    return this.system.readSesqui(ea);
  }

  // Direct Page
  private Am_dpag(): Address {
    const offset = this.system.read(bank(this.PBR.byte) | this.PC.word);
    this.incProgramCounter(1);
    this.cycles += 1;
    return addr(0, word(this.DP.word + offset));
  }

  // Direct Page Indexed X - d,X
  private Am_dpgx(): Address {
    const offset =
      this.system.read(bank(this.PBR.byte) | this.PC.word) + this.X.word;
    this.incProgramCounter(1);
    this.cycles += 1;
    return addr(0, word(this.DP.word + offset));
  }
  // Direct Page Indexed Y - d,Y
  private Am_dpgy(): Address {
    const offset =
      this.system.read(bank(this.PBR.byte) | this.PC.word) + this.Y.word;
    this.incProgramCounter(1);
    this.cycles += 1;
    return addr(0, word(this.DP.word + offset));
  }

  // Direct Page Indirect - (d)
  private Am_dpgi(): Address {
    const offset = this.system.read(addr(this.PBR.byte, this.PC.word));
    this.incProgramCounter(1);
    this.cycles += 3;
    return addr(
      this.DBR.byte,
      this.system.readWord(addr(0, word(this.DP.word + offset)))
    );
  }

  // Direct Page Indexed Indirect X - (d,X)
  private Am_dpix(): Address {
    const offset = this.system.read(addr(this.PBR.byte, this.PC.word));
    this.incProgramCounter(1);
    this.cycles += 3;
    return addr(
      this.DBR.byte,
      this.system.readWord(addr(0, word(this.DP.word + offset + this.X.word)))
    );
  }

  // Direct Page Indexed Indirect Y - (d),Y
  private Am_dpiy(): Address {
    const offset = this.system.read(addr(this.PBR.byte, this.PC.word));
    this.incProgramCounter(1);
    this.cycles += 3;
    return addr(
      this.DBR.byte,
      this.system.readWord(addr(0, word(this.DP.word + offset))) + this.Y.word
    );
  }

  // Direct Page Indirect Long - [d]
  private Am_dpil(): Address {
    const offset = this.system.read(addr(this.PBR.byte, this.PC.word));
    this.incProgramCounter(1);
    this.cycles += 4;
    return this.system.readSesqui(addr(0, word(this.DP.word + offset)));
  }

  // Direct Page Indirect Long Indexed - [d],Y
  private Am_dily(): Address {
    const offset = this.system.read(addr(this.PBR.byte, this.PC.word));
    this.incProgramCounter(1);
    this.cycles += 4;
    return this.system.readSesqui(addr(0, this.DP.word + offset) + this.Y.word);
  }

  // Immidiate byte
  private Am_immb(): Address {
    const addr = bank(this.PBR.byte) | this.PC.word;
    this.incProgramCounter(1);
    this.cycles += 0;
    return addr;
  }

  // Immidiate word
  private Am_immw(): Address {
    const ea = addr(this.PBR.byte, this.PC.word);
    this.incProgramCounter(2);
    this.cycles += 1;
    return ea;
  }

  // Immidiate based on size of A
  private Am_immm(): Address {
    const ea = addr(this.PBR.byte, this.PC.word);
    const size = this.E || this.P.M ? 1 : 2;
    this.incProgramCounter(size);
    this.cycles += size - 1;
    return ea;
  }

  // Immidiate based on size of X/Y
  private Am_immx(): Address {
    const ea = addr(this.PBR.byte, this.PC.word);
    const size = this.E || this.P.X ? 1 : 2;
    this.incProgramCounter(size);
    this.cycles += size - 1;
    return ea;
  }

  // Long Relative - d
  private Am_lrel(): Address {
    const disp = this.system.readWord(addr(this.PBR.byte, this.PC.word));

    this.incProgramCounter(2);
    this.cycles += 2;
    return addr(this.PBR.byte, word(this.PC.word + toSigned(disp)));
  }

  // Relative - d
  private Am_rela(): Address {
    const disp = this.system.read(addr(this.PBR.byte, this.PC.word));

    this.incProgramCounter(1);
    this.cycles += 1;
    return addr(this.PBR.byte, word(this.PC.word + toSigned(disp)));
  }

  // Stack Relative - d,S
  private Am_srel(): Address {
    const disp = this.system.read(addr(this.PBR.byte, this.PC.word));

    this.incProgramCounter(1);
    this.cycles += 1;
    if (this.E) {
      return addr(0, join(this.S.byte + disp, high(this.S.word)));
    }
    return addr(0, word(this.S.word + disp));
  }

  // Stack Relative Idirect Indexed Y - (d,S),Y
  private Am_sriy(): Address {
    const disp = this.system.read(addr(this.PBR.byte, this.PC.word));
    let ia: Word;
    this.incProgramCounter(1);
    this.cycles += 3;
    if (this.E) {
      ia = this.system.readWord(
        addr(0, join(this.S.byte + disp, high(this.S.word)))
      );
    } else {
      ia = this.system.readWord(addr(0, word(this.S.word + disp)));
    }

    return addr(this.DBR.byte, word(ia + this.Y.word));
  }

  private SetC(n: number) {
    this.P.C = n !== 0;
  }
  private SetD(d: boolean) {
    this.P.D = d;
  }
  private SetV(v: boolean) {
    this.P.V = v;
  }
  private SetN(n: number) {
    this.P.N = n !== 0;
  }
  private SetZ(n: number) {
    this.P.Z = n === 0;
  }
  private SetI(i: boolean) {
    this.P.I = i;
  }

  public setNZ(b: Byte) {
    this.P.Z = b === 0;
    this.SetN(b & 0x80);
  }

  public setNZWord(w: Word) {
    this.P.Z = w === 0;
    this.SetN(w & 0x8000);
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
    w = w & 0x00ffff;
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
