import { RAM_END, RAM_START } from "./System";
import { join, low, high } from "./Utils";

export class RAM implements AddressBus {
  mem: Uint8Array;
  lastAccess: Address | undefined;
  lastAccessSize: 2 | 4 = 2;
  lastAccessType: "read" | "write" = "read";

  public constructor() {
    this.mem = new Uint8Array(RAM_END - RAM_START);
  }
  public read(addr: Address): Byte {
    this.lastAccess = addr;
    this.lastAccessSize = 2;
    this.lastAccessType = "read";
    return this.mem[addr];
  }
  public readWord(addr: Address): Word {
    this.lastAccess = addr;
    this.lastAccessSize = 4;
    this.lastAccessType = "read";
    return join(this.mem[addr], this.mem[addr + 1]);
  }
  public write(addr: Address, data: Byte): void {
    this.lastAccess = addr;
    this.lastAccessSize = 2;
    this.lastAccessType = "write";
    this.mem[addr] = data;
  }
  public writeWord(addr: Address, data: Word): void {
    this.lastAccess = addr;
    this.lastAccessSize = 4;
    this.lastAccessType = "write";
    this.mem[addr] = low(data);
    this.mem[addr + 1] = high(data);
  }

  public readSlice(addr: Address, length: number): Uint8Array {
    return this.mem.slice(addr, addr + length);
  }
  public writeSlice(addr: Address, data: Uint8Array) {
    const newMem = Array.from(this.mem);
    newMem.splice(addr, data.length, ...data);
    this.mem = new Uint8Array(newMem);
  }

  public clearAccess() {
    this.lastAccess = undefined;
  }
}
