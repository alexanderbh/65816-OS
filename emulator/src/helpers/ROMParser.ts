import { ROM_OFFSET } from "../App";

export const ParseRom = (romBuffer: ArrayBuffer): string => {
  const rom = new Uint8Array(romBuffer);
  let result = "";
  let addDots = false;
  console.log("length", rom.length);
  for (let addr = 0; addr < rom.length / 16; addr += 1) {
    const addrPrefix =
      (16 * addr + ROM_OFFSET).toString(16).padEnd(4, "0") + " ";
    const bytes: string[] = [];
    let lineHasData = false;
    for (let word = 0; word < 16; word++) {
      const bb = rom[16 * addr + word];
      if (bb > 0) {
        lineHasData = true;
      }
      bytes.push(bb?.toString(16).padStart(2, "0"));
    }
    if (lineHasData) {
      if (addDots) {
        result += "...\n";
        addDots = false;
      }
      result += addrPrefix + bytes.join(" ") + "\n";
    } else {
      addDots = true;
    }
  }
  return result;
};
