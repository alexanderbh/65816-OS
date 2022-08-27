import { EventEmitter } from "events";
import { clearInterval } from "timers";
import { CPU } from "./CPU";
import { RAM } from "./RAM";
import { ROM } from "./ROM";

export const ROM_START = 0xc000;
export const RAM_START = 0;
export const RAM_END = 0xafff;

type MemoryDevice = {
  start: Address;
  end: Address;
  device: AddressBus;
  type: "ram" | "rom";
};

export class System extends EventEmitter implements AddressBus {
  private observer: (cpu: System) => void;
  public ram: RAM;
  private rom?: ROM;
  cpu: CPU;
  private memoryMap: MemoryDevice[];
  private memMap: Map<Address, MemoryDevice> = new Map();
  private interval?: NodeJS.Timeout;

  public constructor(rom?: ROM) {
    super();
    this.observer = () => {};
    this.ram = new RAM();
    this.rom = rom;
    this.cpu = new CPU(this);
    this.memoryMap = [];
    this.memoryMap.push({
      start: RAM_START,
      end: RAM_END,
      device: this.ram,
      type: "ram",
    });
    if (this.rom) {
      this.memoryMap.push({
        start: ROM_START,
        end: 0xffff,
        device: this.rom,
        type: "rom",
      });
    }
    this.prepareMemoryMap();
  }

  private prepareMemoryMap() {
    this.memMap.clear();
    for (let i = 0; i < Math.pow(2, 16); i++) {
      const entry = this.memoryMap.find((p) => p.start <= i && p.end >= i);
      if (entry) {
        this.memMap.set(i, entry);
      }
    }
  }

  public observe(cb: (sys: System) => void) {
    this.observer = cb;
  }

  public changed() {
    if (this.observer) {
      this.observer(this);
    }
  }

  public loadRom(rom: ROM) {
    this.rom = rom;
    this.memoryMap = this.memoryMap.filter((p) => p.type !== "rom");
    this.memoryMap.push({
      start: ROM_START,
      end: 0xffff,
      device: this.rom,
      type: "rom",
    });
    this.prepareMemoryMap();
  }

  public reset() {
    this.cpu?.reset();
    this.changed();
  }

  public step() {
    this.cpu.step();
    this.sendEvent("stopOnStep");
  }

  public start(rom: ROM, debug: boolean, stopOnEntry: boolean) {
    this.loadRom(rom);
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

  public read(addr: Address): Byte {
    return this.resolveAddress(addr).read(addr);
  }
  public readWord(addr: Address): Word {
    return this.resolveAddress(addr).readWord(addr);
  }
  public readSlice(addr: Address, length: number): Uint8Array {
    const entry = this.memMap.get(addr);
    if (entry) {
      const possibleEnd = entry.end < addr + length ? entry.end - addr : length;
      return entry.device.readSlice(addr, possibleEnd);
    }
    return new Uint8Array();
  }
  public write(addr: Address, data: Byte): void {
    this.resolveAddress(addr).write(addr, data);
  }
  public writeWord(addr: Address, data: Word): void {
    this.resolveAddress(addr).writeWord(addr, data);
  }
  public writeSlice(addr: Address, data: Uint8Array) {
    this.resolveAddress(addr).writeSlice(addr, data);
  }

  private resolveAddress(addr: Address): AddressBus {
    const entry = this.memMap.get(addr);
    if (entry) {
      return entry.device;
    }
    throw new Error("No device found for: " + addr);
  }

  private sendEvent(event: string, ...args: any[]): void {
    setTimeout(() => {
      this.emit(event, ...args);
    }, 0);
  }
}
