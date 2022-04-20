import { ROM, System } from "../system";
import { generateRom } from "../utils";

describe("Can read RAM", () => {
  it("should read write ram", () => {
    const sys = new System();
    sys.write(42, 88);

    expect(sys.read(42)).toEqual(88);
  });

  it("should read undefined from empty ram", () => {
    const sys = new System();

    expect(sys.read(42)).toEqual(undefined);
  });
});

describe("Opcodes", () => {
  it("lda immediate: 0xA9", () => {
    const rom = generateRom([0xa9, 0x42]);
    const sys = new System(rom);

    sys.cpu.reset();
    sys.cpu.step();

    expect(sys.cpu.A.byte).toEqual(0x42);
    expect(sys.cpu.A.word).toEqual(0x42);
  });
  it("lda immediate: 0xA9 - emulation off", () => {
    const rom = generateRom([0x18, 0xfb, 0xa9, 0x42]);
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.C).toEqual(false);
    expect(sys.cpu.E).toEqual(true);

    sys.cpu.step();
    expect(sys.cpu.P.C).toEqual(false);
    sys.cpu.step();
    expect(sys.cpu.E).toEqual(false);

    sys.cpu.step();
    expect(sys.cpu.A.byte).toEqual(0x42);
    expect(sys.cpu.A.word).toEqual(0x42);
  });
  it("lda immediate: 0xA9 - emulation off - A: 16bit", () => {
    const rom = generateRom([0x18, 0xfb, 0xc2, 0x20, 0xa9, 0x42, 0x69]);
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.C).toEqual(false);
    expect(sys.cpu.P.M).toEqual(true);
    expect(sys.cpu.P.X).toEqual(true);
    expect(sys.cpu.E).toEqual(true);

    sys.cpu.step(); // 0x18
    expect(sys.cpu.P.C).toEqual(false);

    sys.cpu.step(); // 0xfb
    expect(sys.cpu.E).toEqual(false);

    sys.cpu.step(); // 0xc2, 0x20
    expect(sys.cpu.P.M).toEqual(false);

    sys.cpu.step(); // 0xa9, 0x42 0x69
    expect(sys.cpu.A.word).toEqual(0x6942);
  });
});
