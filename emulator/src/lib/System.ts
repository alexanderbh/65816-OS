import { CPU } from "./CPU";
import { RAM } from "./RAM";
import { ROM } from "./ROM";

export const ROM_START = 0xc000;

export class System implements AddressBus {
  private observer: (cpu: System) => void;
  private ram: RAM;
  private rom?: ROM;
  cpu: CPU;
  private memoryMap: { start: Address; end: Address; device: AddressBus }[];

  public constructor(rom?: ROM) {
    this.observer = () => {};
    this.ram = new RAM();
    this.rom = rom;
    this.cpu = new CPU(this);
    this.memoryMap = [];
    this.memoryMap.push({ start: 0, end: 0xafff, device: this.ram });
    if (this.rom) {
      this.memoryMap.push({ start: ROM_START, end: 0xffff, device: this.rom });
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

  public reset() {
    this.cpu?.reset();
    this.changed();
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
