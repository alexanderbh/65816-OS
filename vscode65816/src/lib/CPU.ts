/* eslint-disable @typescript-eslint/naming-convention */
import { randomInt } from "crypto";
import { Register } from "./Register";
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
  PC: Register;
  PBR: Register;
  DBR: Register;
  DP: Register;
  A: Register;
  X: Register;
  Y: Register;
  S: Register;

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

    this.PC = new Register("PC", system, false, { size: 16, value: 0xfffc });
    this.PBR = new Register("PBR", system, false);
    this.DBR = new Register("DBR", system, false);
    this.DP = new Register("DP", system, false);
    this.A = new Register("A", system, true);
    this.X = new Register("X", system, true);
    this.Y = new Register("Y", system, true);
    this.S = new Register("S", system, false, {
      size: 16,
      value: 0x0100 + randomInt(0, 255),
    });
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

      const phi2Before = this.cycles;
      // prettier-ignore
      // eslint-disable-next-line no-lone-blocks
      {
        switch (opcode) {
          case 0x00:	this.Op_brk(this.Am_immb());	break;
          case 0x01:	this.Op_ora(this.Am_dpix());	break;
          case 0x02:	this.Op_cop(this.Am_immb());	break;
          case 0x03:	this.Op_ora(this.Am_srel());	break;
          case 0x04:	this.Op_tsb(this.Am_dpag());	break;
          case 0x05:	this.Op_ora(this.Am_dpag());	break;
          case 0x06:	this.Op_asl(this.Am_dpag());	break;
          case 0x07:	this.Op_ora(this.Am_dpil());	break;
          case 0x08:	this.Op_php();	break;
          case 0x09:	this.Op_ora(this.Am_immm());	break;
          case 0x0a:	this.Op_asla();	break;
          case 0x0b:	this.Op_phd();	break;
          case 0x0c:	this.Op_tsb(this.Am_absl());	break;
          case 0x0d:	this.Op_ora(this.Am_absl());	break;
          case 0x0e:	this.Op_asl(this.Am_absl());	break;
          case 0x0f:	this.Op_ora(this.Am_alng());	break;

          case 0x10:	this.Op_bpl(this.Am_rela());	break;
          case 0x11:	this.Op_ora(this.Am_dpiy());	break;
          case 0x12:	this.Op_ora(this.Am_dpgi());	break;
          case 0x13:	this.Op_ora(this.Am_sriy());	break;
          case 0x14:	this.Op_trb(this.Am_dpag());	break;
          case 0x15:	this.Op_ora(this.Am_dpgx());	break;
          case 0x16:	this.Op_asl(this.Am_dpgx());	break;
          case 0x17:	this.Op_ora(this.Am_dily());	break;
          case 0x18:	this.Op_clc();	break;
          case 0x19:	this.Op_ora(this.Am_absy());	break;
          case 0x1a:	this.Op_inca();	break;
          case 0x1b:	this.Op_tcs();	break;
          case 0x1c:	this.Op_trb(this.Am_absl());	break;
          case 0x1d:	this.Op_ora(this.Am_absx());	break;
          case 0x1e:	this.Op_asl(this.Am_absx());	break;
          case 0x1f:	this.Op_ora(this.Am_alnx());	break;

          case 0x20:	this.Op_jsr(this.Am_absl2());	break;
          case 0x21:	this.Op_and(this.Am_dpix());	break;
          case 0x22:	this.Op_jsl(this.Am_alng());	break;
          case 0x23:	this.Op_and(this.Am_srel());	break;
          case 0x24:	this.Op_bit(this.Am_dpag());	break;
          case 0x25:  this.Op_and(this.Am_dpag());	break;
          case 0x26:	this.Op_rol(this.Am_dpag());	break;
          case 0x27:	this.Op_and(this.Am_dpil());	break;
          case 0x28:	this.Op_plp();	break;
          case 0x29:	this.Op_and(this.Am_immm());	break;
          case 0x2a:	this.Op_rola();	break;
          case 0x2b:	this.Op_pld();	break;
          case 0x2c:	this.Op_bit(this.Am_absl());	break;
          case 0x2d:  this.Op_and(this.Am_absl());	break;
          case 0x2e:	this.Op_rol(this.Am_absl());	break;
          case 0x2f:  this.Op_and(this.Am_alng());	break;

          case 0x30:	this.Op_bmi(this.Am_rela());	break;
          case 0x31: 	this.Op_and(this.Am_dpiy());	break;
          case 0x32: 	this.Op_and(this.Am_dpgi());	break;
          case 0x33: 	this.Op_and(this.Am_sriy());	break;
          case 0x34:	this.Op_bit(this.Am_dpgx());	break;
          case 0x35: 	this.Op_and(this.Am_dpgx());	break;
          case 0x36:	this.Op_rol(this.Am_dpgx());	break;
          case 0x37: 	this.Op_and(this.Am_dily());	break;
          case 0x38:	this.Op_sec();	break;
          case 0x39: 	this.Op_and(this.Am_absy());	break;
          case 0x3a:	this.Op_deca();	break;
          case 0x3b:	this.Op_tsc();	break;
          case 0x3c:	this.Op_bit(this.Am_absx());	break;
          case 0x3d: 	this.Op_and(this.Am_absx());	break;
          case 0x3e:	this.Op_rol(this.Am_absx());	break;
          case 0x3f: 	this.Op_and(this.Am_alnx());	break;

          case 0x40:	this.Op_rti();	break;
          case 0x41:	this.Op_eor(this.Am_dpix());	break;
          case 0x42:	this.Op_wdm(this.Am_immb());	break;
          case 0x43:	this.Op_eor(this.Am_srel());	break;
          case 0x44:	this.Op_mvp(this.Am_immw());	break;
          case 0x45:	this.Op_eor(this.Am_dpag());	break;
          case 0x46:	this.Op_lsr(this.Am_dpag());	break;
          case 0x47:	this.Op_eor(this.Am_dpil());	break;
          case 0x48:	this.Op_pha();	break;
          case 0x49:	this.Op_eor(this.Am_immm());	break;
          case 0x4a:	this.Op_lsra();	break;
          case 0x4b:	this.Op_phk();	break;
          case 0x4c:	this.Op_jmp(this.Am_absl2());	break;
          case 0x4d:	this.Op_eor(this.Am_absl());	break;
          case 0x4e:	this.Op_lsr(this.Am_absl());	break;
          case 0x4f:	this.Op_eor(this.Am_alng());	break;

          case 0x50:	this.Op_bvc(this.Am_rela());	break;
          case 0x51:	this.Op_eor(this.Am_dpiy());	break;
          case 0x52:	this.Op_eor(this.Am_dpgi());	break;
          case 0x53:	this.Op_eor(this.Am_sriy());	break;
          case 0x54:	this.Op_mvn(this.Am_immw());	break;
          case 0x55:	this.Op_eor(this.Am_dpgx());	break;
          case 0x56:	this.Op_lsr(this.Am_dpgx());	break;
          case 0x57:	this.Op_eor(this.Am_dpiy());	break;
          case 0x58:	this.Op_cli();	break;
          case 0x59:	this.Op_eor(this.Am_absy());	break;
          case 0x5a:	this.Op_phy();	break;
          case 0x5b:	this.Op_tcd();	break;
          case 0x5c:	this.Op_jmp(this.Am_alng());	break;
          case 0x5d:	this.Op_eor(this.Am_absx());	break;
          case 0x5e:	this.Op_lsr(this.Am_absx());	break;
          case 0x5f:	this.Op_eor(this.Am_alnx());	break;

          case 0x60:	this.Op_rts();	break;
          case 0x61:	this.Op_adc(this.Am_dpix());	break;
          case 0x62:	this.Op_per(this.Am_lrel());	break;
          case 0x63:	this.Op_adc(this.Am_srel());	break;
          case 0x64:	this.Op_stz(this.Am_dpag());	break;
          case 0x65:	this.Op_adc(this.Am_dpag());	break;
          case 0x66:	this.Op_ror(this.Am_dpag());	break;
          case 0x67:	this.Op_adc(this.Am_dpil());	break;
          case 0x68:	this.Op_pla();	break;
          case 0x69:	this.Op_adc(this.Am_immm());	break;
          case 0x6a:	this.Op_rora();	break;
          case 0x6b:	this.Op_rtl();	break;
          case 0x6c:	this.Op_jmp(this.Am_absi());	break;
          case 0x6d:	this.Op_adc(this.Am_absl());	break;
          case 0x6e:	this.Op_ror(this.Am_absl());	break;
          case 0x6f:	this.Op_adc(this.Am_alng());	break;

          case 0x70:	this.Op_bvs(this.Am_rela());	break;
          case 0x71:	this.Op_adc(this.Am_dpiy());	break;
          case 0x72:	this.Op_adc(this.Am_dpgi());	break;
          case 0x73:	this.Op_adc(this.Am_sriy());	break;
          case 0x74:	this.Op_stz(this.Am_dpgx());	break;
          case 0x75:	this.Op_adc(this.Am_dpgx());	break;
          case 0x76:	this.Op_ror(this.Am_dpgx());	break;
          case 0x77:	this.Op_adc(this.Am_dily());	break;
          case 0x78:	this.Op_sei();	break;
          case 0x79:	this.Op_adc(this.Am_absy());	break;
          case 0x7a:	this.Op_ply();	break;
          case 0x7b:	this.Op_tdc();	break;
          case 0x7c:	this.Op_jmp(this.Am_abxi());	break;
          case 0x7d:	this.Op_adc(this.Am_absx());	break;
          case 0x7e:	this.Op_ror(this.Am_absx());	break;
          case 0x7f:	this.Op_adc(this.Am_alnx());	break;

          case 0x80:	this.Op_bra(this.Am_rela());	break;
          case 0x81:	this.Op_sta(this.Am_dpix());	break;
          case 0x82:	this.Op_brl(this.Am_lrel());	break;
          case 0x83:	this.Op_sta(this.Am_srel());	break;
          case 0x84:	this.Op_sty(this.Am_dpag());	break;
          case 0x85:	this.Op_sta(this.Am_dpag());	break;
          case 0x86:	this.Op_stx(this.Am_dpag());	break;
          case 0x87:	this.Op_sta(this.Am_dpil());	break;
          case 0x88:	this.Op_dey();	break;
          case 0x89:	this.Op_biti(this.Am_immm());	break;
          case 0x8a:	this.Op_txa();	break;
          case 0x8b:	this.Op_phb();	break;
          case 0x8c:	this.Op_sty(this.Am_absl());	break;
          case 0x8d:	this.Op_sta(this.Am_absl());	break;
          case 0x8e:	this.Op_stx(this.Am_absl());	break;
          case 0x8f:	this.Op_sta(this.Am_alng());	break;

          case 0x90:	this.Op_bcc(this.Am_rela());	break;
          case 0x91:	this.Op_sta(this.Am_dpiy());	break;
          case 0x92:	this.Op_sta(this.Am_dpgi());	break;
          case 0x93:	this.Op_sta(this.Am_sriy());	break;
          case 0x94:	this.Op_sty(this.Am_dpgx());	break;
          case 0x95:	this.Op_sta(this.Am_dpgx());	break;
          case 0x96:	this.Op_stx(this.Am_dpgy());	break;
          case 0x97:	this.Op_sta(this.Am_dily());	break;
          case 0x98:	this.Op_tya();	break;
          case 0x99:	this.Op_sta(this.Am_absy());	break;
          case 0x9a:	this.Op_txs();	break;
          case 0x9b:	this.Op_txy();	break;
          case 0x9c:	this.Op_stz(this.Am_absl());	break;
          case 0x9d:	this.Op_sta(this.Am_absx());	break;
          case 0x9e:	this.Op_stz(this.Am_absx());	break;
          case 0x9f:	this.Op_sta(this.Am_alnx());	break;

          case 0xa0:	this.Op_ldy(this.Am_immx());	break;
          case 0xa1:	this.Op_lda(this.Am_dpix());	break;
          case 0xa2:	this.Op_ldx(this.Am_immx());	break;
          case 0xa3:	this.Op_lda(this.Am_srel());	break;
          case 0xa4:	this.Op_ldy(this.Am_dpag());	break;
          case 0xa5:	this.Op_lda(this.Am_dpag());	break;
          case 0xa6:	this.Op_ldx(this.Am_dpag());	break;
          case 0xa7:	this.Op_lda(this.Am_dpil());	break;
          case 0xa8:	this.Op_tay();	break;
          case 0xa9:	this.Op_lda(this.Am_immm());	break;
          case 0xaa:	this.Op_tax();	break;
          case 0xab:	this.Op_plb();	break;
          case 0xac:	this.Op_ldy(this.Am_absl());	break;
          case 0xad:	this.Op_lda(this.Am_absl());	break;
          case 0xae:	this.Op_ldx(this.Am_absl());	break;
          case 0xaf:	this.Op_lda(this.Am_alng());	break;

          case 0xb0:	this.Op_bcs(this.Am_rela());	break;
          case 0xb1:	this.Op_lda(this.Am_dpiy());	break;
          case 0xb2:	this.Op_lda(this.Am_dpgi());	break;
          case 0xb3:	this.Op_lda(this.Am_sriy());	break;
          case 0xb4:	this.Op_ldy(this.Am_dpgx());	break;
          case 0xb5:	this.Op_lda(this.Am_dpgx());	break;
          case 0xb6:	this.Op_ldx(this.Am_dpgy());	break;
          case 0xb7:	this.Op_lda(this.Am_dily());	break;
          case 0xb8:	this.Op_clv();	break;
          case 0xb9:	this.Op_lda(this.Am_absy());	break;
          case 0xba:	this.Op_tsx();	break;
          case 0xbb:	this.Op_tyx();	break;
          case 0xbc:	this.Op_ldy(this.Am_absx());	break;
          case 0xbd:	this.Op_lda(this.Am_absx());	break;
          case 0xbe:	this.Op_ldx(this.Am_absy());	break;
          case 0xbf:	this.Op_lda(this.Am_alnx());	break;

          case 0xc0:	this.Op_cpy(this.Am_immx());	break;
          case 0xc1:	this.Op_cmp(this.Am_dpix());	break;
          case 0xc2:	this.Op_rep(this.Am_immb());	break;
          case 0xc3:	this.Op_cmp(this.Am_srel());	break;
          case 0xc4:	this.Op_cpy(this.Am_dpag());	break;
          case 0xc5:	this.Op_cmp(this.Am_dpag());	break;
          case 0xc6:	this.Op_dec(this.Am_dpag());	break;
          case 0xc7:	this.Op_cmp(this.Am_dpil());	break;
          case 0xc8:	this.Op_iny();	break;
          case 0xc9:	this.Op_cmp(this.Am_immm());	break;
          case 0xca:	this.Op_dex();	break;
          case 0xcb:	this.Op_wai();	break;
          case 0xcc:	this.Op_cpy(this.Am_absl());	break;
          case 0xcd:	this.Op_cmp(this.Am_absl());	break;
          case 0xce:	this.Op_dec(this.Am_absl());	break;
          case 0xcf:	this.Op_cmp(this.Am_alng());	break;

          case 0xd0:	this.Op_bne(this.Am_rela());	break;
          case 0xd1:	this.Op_cmp(this.Am_dpiy());	break;
          case 0xd2:	this.Op_cmp(this.Am_dpgi());	break;
          case 0xd3:	this.Op_cmp(this.Am_sriy());	break;
          case 0xd4:	this.Op_pei(this.Am_dpag());	break;
          case 0xd5:	this.Op_cmp(this.Am_dpgx());	break;
          case 0xd6:	this.Op_dec(this.Am_dpgx());	break;
          case 0xd7:	this.Op_cmp(this.Am_dily());	break;
          case 0xd8:	this.Op_cld();	break;
          case 0xd9:	this.Op_cmp(this.Am_absy());	break;
          case 0xda:	this.Op_phx();	break;
          case 0xdb:	this.Op_stp();	break;
          case 0xdc:	this.Op_jmp(this.Am_abil());	break;
          case 0xdd:	this.Op_cmp(this.Am_absx());	break;
          case 0xde:	this.Op_dec(this.Am_absx());	break;
          case 0xdf:	this.Op_cmp(this.Am_alnx());	break;

          case 0xe0:	this.Op_cpx(this.Am_immx());	break;
          case 0xe1:	this.Op_sbc(this.Am_dpix());	break;
          case 0xe2:	this.Op_sep(this.Am_immb());	break;
          case 0xe3:	this.Op_sbc(this.Am_srel());	break;
          case 0xe4:	this.Op_cpx(this.Am_dpag());	break;
          case 0xe5:	this.Op_sbc(this.Am_dpag());	break;
          case 0xe6:	this.Op_inc(this.Am_dpag());	break;
          case 0xe7:	this.Op_sbc(this.Am_dpil());	break;
          case 0xe8:	this.Op_inx();	break;
          case 0xe9:	this.Op_sbc(this.Am_immm());	break;
          case 0xea:	this.Op_nop();	break;
          case 0xeb:	this.Op_xba();	break;
          case 0xec:	this.Op_cpx(this.Am_absl());	break;
          case 0xed:	this.Op_sbc(this.Am_absl());	break;
          case 0xee:	this.Op_inc(this.Am_absl());	break;
          case 0xef:	this.Op_sbc(this.Am_alng());	break;

          case 0xf0:	this.Op_beq(this.Am_rela());	break;
          case 0xf1:	this.Op_sbc(this.Am_dpiy());	break;
          case 0xf2:	this.Op_sbc(this.Am_dpgi());	break;
          case 0xf3:	this.Op_sbc(this.Am_sriy());	break;
          case 0xf4:	this.Op_pea(this.Am_immw());	break;
          case 0xf5:	this.Op_sbc(this.Am_dpgx());	break;
          case 0xf6:	this.Op_inc(this.Am_dpgx());	break;
          case 0xf7:	this.Op_sbc(this.Am_dily());	break;
          case 0xf8:	this.Op_sed();	break;
          case 0xf9:	this.Op_sbc(this.Am_absy());	break;
          case 0xfa:	this.Op_plx();	break;
          case 0xfb:	this.Op_xce();	break;
          case 0xfc:	this.Op_jsr(this.Am_abxi());	break;
          case 0xfd:	this.Op_sbc(this.Am_absx());	break;
          case 0xfe:	this.Op_inc(this.Am_absx());	break;
          case 0xff:	this.Op_sbc(this.Am_alnx());	break;

          default: throw new Error(`Unknown opcode: ${opcode}`);
        }
      }

      const phi2Delta = this.cycles - phi2Before;
      this.system.phi2(phi2Delta);
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

  private Op_asla() {
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

  private Op_deca() {
    if (this.E || this.P.M) {
      this.A.setByte(this.A.byte - 1);
    } else {
      this.A.setWord(this.A.word - 1);
    }
    this.cycles += 2;
  }

  private Op_dex() {
    if (this.E || this.P.X) {
      this.X.setByte(this.X.byte - 1);
    } else {
      this.X.setWord(this.X.word - 1);
    }
    this.cycles += 2;
  }

  private Op_dey() {
    if (this.E || this.P.X) {
      this.Y.setByte(this.Y.byte - 1);
    } else {
      this.Y.setWord(this.Y.word - 1);
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

  private Op_inca() {
    if (this.E || this.P.M) {
      this.A.setByte(this.A.byte + 1);
    } else {
      this.A.setWord(this.A.word + 1);
    }
    this.cycles += 2;
  }

  private Op_inx() {
    if (this.E || this.P.X) {
      this.X.setByte(this.X.byte + 1);
    } else {
      this.X.setWord(this.X.word + 1);
    }
    this.cycles += 2;
  }

  private Op_iny() {
    if (this.E || this.P.X) {
      this.Y.setByte(this.Y.byte + 1);
    } else {
      this.Y.setWord(this.Y.word + 1);
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

  private Op_lsra() {
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

  private Op_nop() {
    this.cycles += 2;
  }

  private Op_ora(addr: Address) {
    if (this.E || this.P.M) {
      const data = this.system.read(addr);
      this.A.setByte(this.A.byte | data);
      this.cycles += 2;
    } else {
      const data = this.system.readWord(addr);
      this.A.setWord(this.A.word | data);
      this.cycles += 3;
    }
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

  private Op_pha() {
    if (this.E || this.P.M) {
      this.pushByte(this.A.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.A.word);
      this.cycles += 4;
    }
  }

  private Op_phb() {
    this.pushByte(this.DBR.byte);
    this.cycles += 3;
  }

  private Op_phd() {
    this.pushWord(this.DP.word);
    this.cycles += 3;
  }
  private Op_phk() {
    this.pushByte(this.PBR.byte);
    this.cycles += 3;
  }
  private Op_php() {
    this.pushByte(this.StatusRegister());
    this.cycles += 3;
  }
  private Op_phx() {
    if (this.E || this.P.X) {
      this.pushByte(this.X.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.X.word);
      this.cycles += 4;
    }
  }
  private Op_phy() {
    if (this.E || this.P.X) {
      this.pushByte(this.Y.byte);
      this.cycles += 3;
    } else {
      this.pushWord(this.Y.word);
      this.cycles += 4;
    }
  }
  private Op_pla() {
    if (this.E || this.P.M) {
      this.A.setByte(this.pullByte());
      this.cycles += 4;
    } else {
      this.A.setWord(this.pullWord());
      this.cycles += 5;
    }
  }
  private Op_plb() {
    const b = this.pullByte();
    this.DBR.setByte(b);
    this.setNZ(b);
    this.cycles += 4;
  }
  private Op_pld() {
    const b = this.pullWord();
    this.DP.setWord(b);
    this.setNZWord(b);
    this.cycles += 5;
  }
  private Op_plk() {
    const b = this.pullByte();
    this.PBR.setByte(b);
    this.setNZ(b);
    this.cycles += 4;
  }
  private Op_plp() {
    throw new Error("Not implemented: PLP"); // TODO
  }
  private Op_plx() {
    if (this.E || this.P.X) {
      this.X.setByte(this.pullByte());
      this.cycles += 4;
    } else {
      this.X.setWord(this.pullWord());
      this.cycles += 5;
    }
  }
  private Op_ply() {
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
      if ((b & 0x20) !== 0) {
        this.P.M = false;
        this.A.size = 16;
      }
      if ((b & 0x10) !== 0) {
        this.P.X = false;
        this.X.size = 16;
        this.Y.size = 16;
      }
    }
    this.cycles += 3;
  }

  private Op_rol(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(n & 0x80);
      this.setNZ((n << 1) | c);
      this.system.write(addr, (n << 1) | c);
      this.cycles += 4;
    } else {
      const n = this.system.readWord(addr);
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(n & 0x8000);
      this.setNZWord((n << 1) | c);
      this.system.writeWord(addr, (n << 1) | c);
      this.cycles += 5;
    }
  }

  private Op_rola() {
    if (this.E || this.P.M) {
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(this.A.byte & 0x80);
      this.A.setByte((this.A.byte << 1) | c);
    } else {
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(this.A.word & 0x8000);
      this.A.setWord((this.A.word << 1) | c);
    }
    this.cycles += 2;
  }
  private Op_ror(addr: Address) {
    if (this.E || this.P.M) {
      const n = this.system.read(addr);
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(n & 0x80);
      this.setNZ((n >> 1) | c);
      this.system.write(addr, (n >> 1) | c);
      this.cycles += 4;
    } else {
      const n = this.system.readWord(addr);
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(n & 0x8000);
      this.setNZWord((n >> 1) | c);
      this.system.writeWord(addr, (n >> 1) | c);
      this.cycles += 5;
    }
  }
  private Op_rora() {
    if (this.E || this.P.M) {
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(this.A.byte & 0x80);
      this.A.setByte((this.A.byte >> 1) | c);
    } else {
      const c = this.P.C ? 0x01 : 0x00;
      this.SetC(this.A.word & 0x8000);
      this.A.setWord((this.A.word >> 1) | c);
    }
    this.cycles += 2;
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

  private Op_sbc(addr: Address) {
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
      if ((b & 0x20) !== 0) {
        this.P.M = true;
        this.A.size = 8;
      }
      if ((b & 0x30) !== 0) {
        this.P.X = true;
        this.X.size = 8;
        this.Y.size = 8;
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

  private Op_stp() {
    throw new Error("Not implemented: STP"); // TODO
  }

  private Op_stx(addr: Address) {
    if (this.E || this.P.X) {
      this.system.write(addr, this.X.byte);
      this.cycles += 2;
    } else {
      this.system.writeWord(addr, this.X.word);
      this.cycles += 3;
    }
  }

  private Op_sty(addr: Address) {
    if (this.E || this.P.X) {
      this.system.write(addr, this.Y.byte);
      this.cycles += 2;
    } else {
      this.system.writeWord(addr, this.Y.word);
      this.cycles += 3;
    }
  }

  private Op_stz(addr: Address) {
    if (this.E || this.P.M) {
      this.system.write(addr, 0);
      this.cycles += 2;
    } else {
      this.system.writeWord(addr, 0);
      this.cycles += 3;
    }
  }

  private Op_tax() {
    if (this.E || this.P.X) {
      this.X.setWord(join(this.A.byte, 0));
      this.cycles += 2;
    } else {
      this.X.setWord(this.A.word);
    }
    this.cycles += 2;
  }
  private Op_tay() {
    if (this.E || this.P.X) {
      this.Y.setWord(join(this.A.byte, 0));
    } else {
      this.Y.setWord(this.A.word);
    }
    this.cycles += 2;
  }

  private Op_tcd() {
    this.DP.setWord(this.A.word);
    this.cycles += 2;
  }
  private Op_tdc() {
    if (this.E || this.P.M) {
      this.A.setWord(join(this.DP.byte, 0));
    } else {
      this.A.setWord(this.DP.word);
    }
    this.cycles += 2;
  }

  private Op_tcs() {
    this.S.setWord(this.E ? 0x0100 | this.A.byte : this.A.word);
    this.cycles += 2;
  }

  private Op_trb(addr: Address) {
    if (this.E || this.P.M) {
      const b = this.system.read(addr);
      this.system.write(addr, b & ~this.A.byte);
      this.SetZ(b & this.A.byte);
      this.cycles += 4;
    } else {
      const b = this.system.readWord(addr);
      this.system.writeWord(addr, b & ~this.A.word);
      this.SetZ(b & this.A.word);
      this.cycles += 5;
    }
  }
  private Op_tsb(addr: Address) {
    if (this.E || this.P.M) {
      const b = this.system.read(addr);
      this.system.write(addr, b | this.A.byte);
      this.SetZ(b & this.A.byte);
      this.cycles += 4;
    } else {
      const b = this.system.readWord(addr);
      this.system.writeWord(addr, b | this.A.word);
      this.SetZ(b & this.A.word);
      this.cycles += 5;
    }
  }
  private Op_tsc() {
    if (this.E || this.P.M) {
      this.A.setWord(join(this.S.byte, 0));
    } else {
      this.A.setWord(this.S.word);
    }
    this.cycles += 2;
  }
  private Op_tsx() {
    if (this.E || this.P.X) {
      this.X.setWord(join(this.S.byte, 0));
    } else {
      this.X.setWord(this.S.word);
    }
    this.cycles += 2;
  }
  private Op_txa() {
    if (this.E || this.P.M) {
      this.A.setWord(join(this.X.byte, 0));
    } else {
      this.A.setWord(this.X.word);
    }
    this.cycles += 2;
  }
  private Op_txs() {
    if (this.E) {
      this.S.setWord(join(this.X.byte, 0x01));
    } else {
      this.S.setWord(this.X.word);
    }
    this.cycles += 2;
  }
  private Op_txy() {
    if (this.E || this.P.X) {
      this.Y.setWord(this.X.word);
      this.setNZ(this.Y.byte);
    } else {
      this.Y.setWord(this.X.word);
    }
    this.cycles += 2;
  }
  private Op_tya() {
    if (this.E || this.P.M) {
      this.A.setByte(this.Y.byte);
    } else {
      this.A.setWord(this.Y.word);
    }
    this.cycles += 2;
  }
  private Op_tyx() {
    if (this.E || this.P.X) {
      this.X.setWord(this.Y.word);
      this.setNZ(this.X.byte);
    } else {
      this.X.setWord(this.Y.word);
    }
    this.cycles += 2;
  }

  private Op_wai() {
    throw new Error("Not implemented: WAI"); // TODO
  }

  private Op_wdm(addr: Address) {
    throw new Error("Not implemented: WDM"); // TODO
  }

  private Op_xba() {
    this.A.setWord(join(high(this.A.word), low(this.A.word)));
    this.cycles += 3;
  }

  private Op_xce() {
    const tmpC = this.P.C;
    this.P.C = this.E;
    this.E = tmpC;
    this.DP.setByte(0);
    this.S.setWord(join(this.S.byte, 0x01));
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
