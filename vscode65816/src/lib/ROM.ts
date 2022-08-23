import { ROM_START } from "./System";
import { join } from "./Utils";

export class ROM implements AddressBus {
  private startDataOffset: number;
  data: Uint8Array;

  public constructor(data: Uint8Array, dataOffset: number) {
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
  readSlice(addr: Address, length: number): Uint8Array {
    return this.data.slice(
      addr - ROM_START + this.startDataOffset,
      addr - ROM_START + this.startDataOffset + length
    );
  }
  public writeSlice(addr: Sesqui, data: Uint8Array): void {
    throw new Error("ROM write not possible.");
  }
}
