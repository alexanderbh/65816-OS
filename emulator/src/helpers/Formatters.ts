export const toHex = (n: number | null, size = 4) => {
  if (n === null) {
    return "-";
  }
  return "0x" + n.toString(16).toUpperCase().padStart(size, "0");
};
