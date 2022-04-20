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
});
