export const F = {
  EmulationOff: [0x18, 0xfb],
  A16bit: [0xc2, 0x20],
  A8bit: [0xe2, 0x20],
  LdaImmediate: 0xa9,
};

export const make = (snips: (number | number[])[]): number[] => {
  const result: number[] = [];
  snips.forEach((s) => {
    if (typeof s === "number") {
      result.push(s);
    } else {
      result.push(...s);
    }
  });
  return result;
};
