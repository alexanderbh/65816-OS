import { ROM } from "./ROM";
import { ROM_START } from "./System";

export const addr = (w: Word): Address => {
  return w as unknown as Address;
};
export const join = (l: Byte, h: Byte): Word => {
  return l | (h << 8);
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

export const generateRom = (data: Byte[]): ROM => {
  const data4k = new Array<number>(0x4000);
  data.forEach((b, i) => (data4k[i] = b));
  data4k[0xfffc - ROM_START] = 0x00;
  data4k[0xfffd - ROM_START] = 0xc0;
  const rom = new ROM(data4k, 0);
  // console.log({ rom });
  return rom;
};
