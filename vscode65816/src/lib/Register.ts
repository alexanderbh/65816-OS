import { System } from "./System";
import { low, join } from "./Utils";

export class Register {
  public byte: Byte;
  public word: Word;
  public size: 8 | 16 = 8;

  public constructor(
    public name: string,
    private system: System,
    private updatesPRegister: boolean,
    private initialValue?: { size: 8; value: Byte } | { size: 16; value: Word }
  ) {
    this.byte = 0;
    this.word = 0;
    this.size = initialValue?.size || 8;
    this.reset();
  }

  public reset() {
    this.byte =
      this.initialValue?.size === 8
        ? this.initialValue.value
        : this.initialValue?.size === 16
        ? low(this.initialValue.value)
        : 0;
    this.word =
      this.initialValue?.size === 8
        ? join(this.initialValue.value, 0)
        : this.initialValue?.size === 16
        ? this.initialValue.value
        : 0;
  }
  public setByte(b: Byte) {
    // TODO: Over/underflow handled here? or on every use?
    b = b & 0xff;
    this.byte = b;
    this.word = b as Word;
    if (this.updatesPRegister) {
      this.system.cpu.setNZ(b);
    }
  }
  public setWord(w: Word) {
    w = w & 0x00ffff;
    this.word = w;
    this.byte = low(w);
    if (this.updatesPRegister) {
      this.system.cpu.setNZWord(w);
    }
  }

  public toString(radix: number = 16): string {
    return this.size === 16
      ? this.word.toString(radix).padStart(4, "0")
      : this.byte.toString(radix).padStart(2, "0");
  }
}
