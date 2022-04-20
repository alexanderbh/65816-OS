import { addr, high, join, low } from "./utils";

export const ROM_START = 0xc000;
enum LOG_LEVEL {
  DEBUG = 0,
  INFO = 1,
}

const log_level: LOG_LEVEL = LOG_LEVEL.INFO;

const log = {
  debug: (m: string) => log_level >= LOG_LEVEL.DEBUG && console.log(m),
  info: (m: string) => log_level >= LOG_LEVEL.INFO && console.log(m),
};

export class System implements AddressBus {
  private ram: RAM;
  private rom: ROM;
  cpu: CPU;
  private memoryMap: { start: Address; end: Address; device: AddressBus }[];

  public constructor(rom?: ROM) {
    this.ram = new RAM();
    this.rom = rom;
    this.cpu = new CPU(this);
    this.memoryMap = new Array();
    this.memoryMap.push({ start: 0, end: 0xafff, device: this.ram });
    this.memoryMap.push({ start: ROM_START, end: 0xffff, device: this.rom });
  }

  public read(addr: Address): Byte {
    return this.resolveAddress(addr).read(addr);
  }
  public readWord(addr: Address): Word {
    return this.resolveAddress(addr).readWord(addr);
  }
  public write(addr: Address, data: Byte): void {
    this.resolveAddress(addr).write(addr, data);
  }
  public writeWord(addr: Address, data: Word): void {
    this.resolveAddress(addr).writeWord(addr, data);
  }

  private resolveAddress(addr: Address): AddressBus {
    const entry = this.memoryMap.find((p) => addr >= p.start && addr <= p.end);
    if (entry) return entry.device;
    throw new Error("No device found");
  }
}

class RAM implements AddressBus {
  mem: Byte[];
  public constructor() {
    this.mem = new Array(2 ^ 16);
  }
  public read(addr: Address): Byte {
    return this.mem[addr];
  }
  public readWord(addr: Address): Word {
    return join(this.mem[addr], this.mem[addr + 1]);
  }
  public write(addr: Address, data: Byte): void {
    this.mem[addr] = data;
  }
  public writeWord(addr: Address, data: Word): void {
    this.mem[addr] = low(data);
    this.mem[addr + 1] = high(data);
  }
}

class Register {
  public byte: Byte;
  public word: Word;

  public constructor() {
    this.byte = 0;
    this.word = 0;
  }
  public setByte(b: Byte) {
    this.byte = b;
    this.word = join(b, 0);
  }
  public setWord(w: Word) {
    this.word = w;
    this.byte = low(w);
  }
}
class CPU {
  private system: System;
  cycles: number;
  pc: Address;
  A: Register;
  X: Register;
  Y: Register;

  // Processor register
  P: {
    C: boolean; // Carry
    Z: boolean; // Zero
    M: boolean; // A register size: false=16bit true=8bit
    X: boolean; // index register size: false=16bit true=8bit
  };

  // Emulation mode
  E: boolean;

  public constructor(system: System) {
    this.system = system;
  }

  public reset() {
    this.cycles = 0;
    this.pc = 0xfffc;
    this.E = true;
    this.P = {
      C: false,
      Z: true,
      M: true,
      X: true,
    };
    this.A = new Register();
    this.X = new Register();
    this.Y = new Register();
    this.cycles += 7;
    const resetVector = this.system.readWord(this.pc);
    this.pc = addr(resetVector);
  }

  public step() {
    const opcode = this.system.read(this.pc);
    log.debug(
      `Read opcode from: ${this.pc.toString(16)}: ${opcode.toString(16)}`
    );
    this.readBytes(1);
    switch (opcode) {
      case 0x18:
        this.Op_clc();
        break;
      case 0x38:
        this.Op_sec();
        break;
      case 0xa9:
        this.Op_lda(this.Am_immm());
        break;
      case 0xc2:
        this.Op_rep(this.Am_immb());
        break;
      case 0xe2:
        this.Op_sep(this.Am_immb());
        break;
      case 0xfb:
        this.Op_xce();
        break;
    }
  }

  private readBytes(num: number) {
    this.pc += num;
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

  private Op_xce() {
    const tmpC = this.P.C;
    this.P.C = this.E;
    this.E = tmpC;
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

  // Immidiate based on size of A
  private Am_immm(): Address {
    const addr = this.pc;
    const size = this.E || this.P.M ? 1 : 2;
    this.readBytes(size);
    this.cycles += size - 1;
    return addr;
  }

  // Immidiate byte
  private Am_immb(): Address {
    const addr = this.pc;
    this.readBytes(1);
    this.cycles += 0;
    return addr;
  }

  private SetC(n: number) {
    this.P.C = n != 0;
  }
}

export class ROM implements AddressBus {
  private startDataOffset: number;
  data: Byte[];

  public constructor(data: Byte[], dataOffset: number) {
    this.startDataOffset = dataOffset;
    this.data = data;
  }

  read(addr: Address): Byte {
    return this.data[addr - ROM_START + this.startDataOffset];
  }
  readWord(addr: Address): Word {
    return join(
      this.data[addr - ROM_START + this.startDataOffset],
      this.data[addr - ROM_START + this.startDataOffset + 1]
    );
  }

  write(_addr: Address, _data: Byte) {
    throw new Error("ROM write not possible.");
  }
  writeWord(_addr: Address, _data: Word) {
    throw new Error("ROM write not possible.");
  }
}
