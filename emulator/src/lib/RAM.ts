import { RAM_END, RAM_START } from "./System";
import { join, low, high } from "./Utils";

export class RAM implements AddressBus {
  mem: Uint8Array;
  public constructor() {
    this.mem = new Uint8Array(RAM_END - RAM_START);
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
