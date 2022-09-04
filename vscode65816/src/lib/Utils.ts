import { ROM } from "./ROM";
import { ROM_START } from "./System";

export const join = (l: Byte, h: Byte): Word => {
  return l | (h << 8);
};

export const addr = (h: Byte, m: Word): Address => {
  return bank(h) | m;
};

export const word = (addr: number): Word => {
  return addr & 0x00ffff;
};

export const byte = (val: number): Byte => {
  return val & 0xff;
};

export const low = (w: Word): Byte => {
  return w & 0x00ff;
};

export const high = (w: Word): Byte => {
  return w >> 8;
};

export const bank = (bank: Byte): number => {
  return bank << 16;
};

export const toSigned = (number) => (number < 128 ? number : -(256 - number));

export const generateRom = (data: Byte[]): ROM => {
  const data4k = new Uint8Array(0x4000);
  data.forEach((b, i) => (data4k[i] = b));
  data4k[0xfffc - ROM_START] = 0x00;
  data4k[0xfffd - ROM_START] = 0xc0;
  const rom = new ROM(data4k, 0);
  // console.log({ rom });
  return rom;
};
