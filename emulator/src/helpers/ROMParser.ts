import { colors } from "../theme/ThemeSetup";

export const ParseMemory = (
  mem: Uint8Array,
  PC: number | null,
  start: number,
  offset = 0,
  showZeros = false
): string => {
  let result = "";
  let addDots = false;

  for (let addr = (start - offset) / 16; addr < mem.length / 16; addr += 1) {
    const addrPrefix =
      (16 * addr + offset).toString(16).toUpperCase().padStart(4, "0") + " ";

    const bytes: string[] = [];
    let lineHasData = false;
    for (let word = 0; word < 16; word++) {
      const byteAddr = 16 * addr + word;
      const bb = mem[byteAddr];
      if (bb > 0) {
        lineHasData = true;
        const byteString = bb?.toString(16).toUpperCase().padStart(2, "0");
        if (PC === byteAddr + offset) {
          bytes.push(
            `<span style="color:${colors.highlight}">${byteString}</span>`
          );
        } else {
          bytes.push(byteString);
        }
      } else {
        bytes.push("00");
      }
    }
    if (lineHasData || showZeros) {
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
