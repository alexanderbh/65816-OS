import { Register } from "./Register";
import { PHI2Listener, System } from "./System";
import { high, low } from "./Utils";

export class VIA6522 implements AddressBus, PHI2Listener {
  public readonly registers: Register[] = [];
  private readonly registerMap = new Map<string, Register>();
  private timer1Running = false;

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
    this.registers.forEach((register) => {
      this.registerMap.set(register.name, register);
    });
    this.system.phi2Listeners.push(this);
  }

  phi2(count: number): void {
    if (!this.timer1Running) {
      return;
    }
    const t1cl = this.registerMap.get("T1C-L")!;
    if (t1cl.byte - count <= 0) {
      const t1ch = this.registerMap.get("T1C-H")!;

      const low = t1cl.byte - count;

      if (low < 0) {
        t1ch.setByte(t1ch.byte - 1);
        t1cl.setByte(0xff - Math.abs(low) + 1);
      } else {
        t1cl.setByte(low);
      }

      if ((t1cl.byte === 0 && t1ch.byte === 0) || t1ch.byte <= 0) {
        const timer1Acr = (this.registerMap.get("ACR")!.byte & 0b11000000) >> 6;
        if (timer1Acr === 0b00) {
          this.timer1Running = false;
          t1ch.setByte(0);
        } else if (timer1Acr === 0b10 || timer1Acr === 0b11) {
          throw new Error("timer1 operation 0b10 and 0b11 not implemented");
        } else {
          this.timer1LatchToCounter();
        }

        if ((this.registerMap.get("IER")!.byte & 0b01000000) > 0) {
          this.registerMap
            .get("IFR")!
            .setByte(this.registerMap.get("IFR")!.byte | 0b11000000);
          this.system.cpu.interruptPending = true;
        }
      }
    } else {
      t1cl.setByte(t1cl.byte - count);
    }
  }

  timer1LatchToCounter(): void {
    this.registerMap.get("T1C-L")!.setByte(this.registerMap.get("T1L-L")!.byte);
    this.registerMap.get("T1C-H")!.setByte(this.registerMap.get("T1L-H")!.byte);
  }

  read(addr: Sesqui): Byte {
    const register = this.registers[addr - this.startAddress];
    switch (register.name) {
      case "IER":
        return 0b10000000 | register.byte;
      case "T1C-L":
        this.registerMap
          .get("IFR")!
          .setByte(this.registerMap.get("IFR")!.byte & 0b10111111);
        if (this.registerMap.get("IFR")?.byte === 0b10000000) {
          this.registerMap.get("IFR")!.setByte(0);
          this.system.cpu.interruptPending = false;
        }
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
      case "T1C-L":
        this.registerMap.get("T1L-L")!.setByte(data);
        break;
      case "T1C-H":
        this.registerMap.get("T1L-H")!.setByte(data);
        this.timer1LatchToCounter();
        this.timer1Running = true;
        break;
      case "T1L-H":
        this.registerMap
          .get("IFR")!
          .setByte(this.registerMap.get("IFR")!.byte & 0b10111111);
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
