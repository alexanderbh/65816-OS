import { join, low, high } from "./Utils";

export class RAM implements AddressBus {
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
