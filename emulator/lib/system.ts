interface AddressBus {
  read(addr: Address): Data;
  write(addr: Address, data: Data);
}

export class System {
  private ram: RAM;
  private memoryMap: { start: Address; end: Address; device: AddressBus }[];

  public constructor() {
    this.ram = new RAM();
    this.memoryMap = new Array();
    this.memoryMap.push({ start: 0, end: 0xafff, device: this.ram });
  }
  public read(addr: Address): Data {
    return this.resolveAddress(addr).read(addr);
  }
  public write(addr: Address, data: Data): void {
    this.resolveAddress(addr).write(addr, data);
  }

  private resolveAddress(addr: Address): AddressBus {
    const entry = this.memoryMap.find((p) => addr >= p.start && addr <= p.end);
    if (entry) return entry.device;
    throw new Error("No device found");
  }
}

class RAM implements AddressBus {
  mem: number[];
  public constructor() {
    this.mem = new Array(2 ^ 16);
    this.mem.forEach((_, idx) => (this.mem[idx] = 0));
  }
  public read(addr: Address): Data {
    return this.mem[addr];
  }
  public write(addr: Address, data: Data): void {
    this.mem[addr] = data;
  }
}

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Address = Flavor<number, "Address">;
type Data = Flavor<number, "Data">;
