import { addr, high, join, low } from "./utils";

export const ROM_START = 0xc000;
const log = {
  debug: (m: string) => console.log(m),
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

  // Processor register
  P: {
    M: boolean; // A register size: false=16bit true=8bit
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
      M: true,
    };
    this.A = new Register();
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
      case 0xa9:
        this.Op_lda(this.Am_immm());
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

  private Am_immm(): Address {
    const addr = this.pc;
    const size = this.E || this.P.M ? 1 : 2;
    this.readBytes(size);
    this.cycles += size - 1;
    return addr;
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
