import { Register } from "./Register";
import { System } from "./System";
import { high, low } from "./Utils";

export class VIA6522 implements AddressBus {
  public readonly registers: Register[] = [];

  constructor(private system: System, private startAddress: Address) {
    this.registers = [
      new Register("ORB/IRB", system, false),
      new Register("ORA/IRA", system, false),
      new Register("DDRB", system, false),
      new Register("DDRA", system, false),
      new Register("T1C-L", system, false),
      new Register("T1C-H", system, false),
      new Register("T1L-L", system, false),
      new Register("T1L-H", system, false),
      new Register("T2C-L", system, false),
      new Register("T2C-H", system, false),
      new Register("SR", system, false),
      new Register("ACR", system, false),
      new Register("PCR", system, false),
      new Register("IFR", system, false),
      new Register("IER", system, false),
      new Register("ORA/IRA", system, false),
    ];
  }

  read(addr: Sesqui): Byte {
    const register = this.registers[addr - this.startAddress];
    switch (register.name) {
      case "IER":
        return 0b10000000 & register.byte;
      default:
        return register.byte;
    }
  }
  readWord(addr: Sesqui): Word {
    throw new Error("Method not implemented.");
  }
  write(addr: Sesqui, data: Byte): void {
    const register = this.registers[addr - this.startAddress];
    switch (register.name) {
      case "IER":
        if (data & 0b10000000) {
          register.setByte(register.byte | (data & 0b01111111));
        } else {
          register.setByte(register.byte & ~(data & 0b01111111));
        }
        break;

      default:
        register.setByte(data);
        break;
    }
  }
  writeWord(addr: Sesqui, data: Word): void {
    this.write(addr, low(data));
    this.write(addr + 1, high(data));
  }

  // Not implemented
  readSlice(addr: Sesqui, length: number): Uint8Array {
    throw new Error("Method not implemented.");
  }
  writeSlice(addr: Sesqui, data: Uint8Array): void {
    throw new Error("Method not implemented.");
  }
  readSesqui(addr: Sesqui): Sesqui {
    throw new Error("Method not implemented.");
  }
}
