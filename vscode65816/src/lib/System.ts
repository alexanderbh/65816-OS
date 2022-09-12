import { EventEmitter } from "events";
import { clearInterval } from "timers";
import { VIA6522 } from "./6522VIA";
import { CPU } from "./CPU";
import { Keyboard } from "./Keyboard";
import { RA8875 } from "./RA8875";
import { RAM } from "./RAM";
import { ROM } from "./ROM";
import { addr } from "./Utils";

export const ROM_START = 0xc000;
export const RAM_START = 0;
export const RAM_END = 0xafff;
export const VIA1_START = 0xb000;
export const VIA1_END = 0xb0ff;

type MemoryDevice = {
  start: Address;
  end: Address;
  device: AddressBus;
  type: "ram" | "rom" | "via";
};

export interface HandshakeDevice {
  highToLowCallback: undefined | (() => void);
  lowToHighCallback: undefined | (() => void);
  readByte(): Byte;
  writeByte(b: Byte): void;
}

export interface PHI2Listener {
  phi2(count: number): void;
}

export class System extends EventEmitter implements AddressBus {
  public ram: RAM;
  private rom?: ROM;
  public cpu: CPU;
  public via1: VIA6522;
  private memoryDevices: MemoryDevice[];
  private memMap: Map<Address, MemoryDevice> = new Map();
  public breakpoints: Set<Address> = new Set();
  private interval?: NodeJS.Timeout;
  public pcToInstructionMap: Map<Address, { size: number }> = new Map();
  public phi2Listener: PHI2Listener | undefined = undefined;

  public constructor(ra8875: RA8875, keyboard: Keyboard) {
    super();
    this.pcToInstructionMap = new Map();
    this.ram = new RAM();
    this.cpu = new CPU(this);
    this.via1 = new VIA6522(this, VIA1_START, new Map([[4, ra8875]]), keyboard);
    this.memoryDevices = [];
    this.memoryDevices.push({
      start: RAM_START,
      end: RAM_END,
      device: this.ram,
      type: "ram",
    });
    if (this.rom) {
      this.memoryDevices.push({
        start: ROM_START,
        end: 0xffff,
        device: this.rom,
        type: "rom",
      });
    }
    this.memoryDevices.push({
      device: this.via1,
      start: VIA1_START,
      end: VIA1_END,
      type: "via",
    });
    this.prepareMemoryMap();
  }

  private prepareMemoryMap() {
    this.memMap.clear();
    for (let i = 0; i < Math.pow(2, 16); i++) {
      const entry = this.memoryDevices.find((p) => p.start <= i && p.end >= i);
      if (entry) {
        this.memMap.set(i, entry);
      }
    }
  }

  public loadRom(rom: ROM) {
    this.rom = rom;
    this.pcToInstructionMap = new Map();
    this.memoryDevices = this.memoryDevices.filter((p) => p.type !== "rom");
    this.memoryDevices.push({
      start: ROM_START,
      end: 0xffff,
      device: this.rom,
      type: "rom",
    });
    this.prepareMemoryMap();
  }

  public reset() {
    this.cpu?.reset();
  }

  public step() {
    this.cpu.step();
    this.sendEvent("stopOnStep");
  }

  public start(
    rom: ROM,
    debug: boolean,
    stopOnEntry: boolean,
    pcToInstructionMap: Map<Address, { size: number }>
  ) {
    this.loadRom(rom);
    this.pcToInstructionMap = pcToInstructionMap;
    this.reset();

    if (debug) {
      // TODO: verify breakpoints
      if (stopOnEntry) {
        this.sendEvent("stopOnEntry");
      } else {
        this.run();
      }
    } else {
      this.run();
    }
  }

  public stepOut() {
    let depth = 1;
    const oneRun = () => {
      for (let i = 0; i < 10000; i++) {
        const opcode = this.cpu.step();
        if (opcode === 0x20 || opcode === 0x22 || opcode === 0xfc) {
          depth++;
        }
        if (opcode === 0x60 || opcode === 0x6b) {
          depth--;
        }
        if (depth === 0) {
          this.sendEvent("stopOnStep");
          return;
        }
      }
      this.interval = setTimeout(oneRun, 0);
    };
    this.interval = setTimeout(oneRun, 0);
  }

  public stepOver() {
    const opcode = this.cpu.step();
    if (opcode === 0x20 || opcode === 0x22 || opcode === 0xfc) {
      this.stepOut();
    } else {
      this.sendEvent("stopOnStep");
    }
  }

  public run() {
    const oneRun = () => {
      for (let i = 0; i < 10000; i++) {
        this.cpu.step();
        if (this.breakpoints.has(addr(this.cpu.PBR.byte, this.cpu.PC.word))) {
          clearInterval(this.interval);
          this.interval = undefined;
          this.sendEvent("stopOnBreakpoint");
          return;
        }
      }
    };
    this.interval = setInterval(oneRun, 0);
  }

  public pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.sendEvent("stopOnStep");
  }

  public phi2(count: number) {
    this.phi2Listener && this.phi2Listener.phi2(count);
  }

  public read(addr: Address): Byte {
    return this.resolveAddress(addr).read(addr);
  }
  public readWord(addr: Address): Word {
    return this.resolveAddress(addr).readWord(addr);
  }
  public readSesqui(addr: Address): Sesqui {
    return this.resolveAddress(addr).readSesqui(addr);
  }
  public readSlice(ad: Address, length: number): Uint8Array {
    const entry = this.memMap.get(ad);
    if (entry) {
      const possibleEnd = entry.end < ad + length ? entry.end - ad : length;
      return entry.device.readSlice(ad, possibleEnd);
    }
    return new Uint8Array();
  }
  public write(ad: Address, data: Byte): void {
    this.resolveAddress(ad).write(ad, data);
  }
  public writeWord(ad: Address, data: Word): void {
    this.resolveAddress(ad).writeWord(ad, data);
  }
  public writeSlice(ad: Address, data: Uint8Array) {
    this.resolveAddress(ad).writeSlice(ad, data);
  }

  private resolveAddress(ad: Address): AddressBus {
    const entry = this.memMap.get(ad);
    if (entry) {
      return entry.device;
    }
    this.sendEvent("stopOnException", new Error("No device found for: " + ad));
    throw new Error("No device found for: " + ad);
  }

  public sendEvent(event: string, ...args: any[]): void {
    setTimeout(() => {
      this.emit(event, ...args);
    }, 0);
  }
}
