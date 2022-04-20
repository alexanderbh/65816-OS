import { make, F } from "./ProgramGenerator";

describe("ProgramGenerator", () => {
  it("should generate known program", () => {
    const generated = make([
      F.EmulationOff,
      F.A16bit,
      F.LdaImmediate,
      0x42,
      0x69,
    ]);

    expect(generated).toEqual([0x18, 0xfb, 0xc2, 0x20, 0xa9, 0x42, 0x69]);
  });
});
