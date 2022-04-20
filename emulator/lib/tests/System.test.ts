import { System } from "../System";
import { generateRom } from "../Utils";
import { make, F } from "./ProgramGenerator";

describe("RAM", () => {
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

describe("Flags", () => {
  it("should set Z flag on lda", () => {
    const rom = generateRom([F.LdaImmediate, 0x42, F.LdaImmediate, 0x00]);
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.Z).toEqual(true);
    sys.cpu.step();
    expect(sys.cpu.P.Z).toEqual(false);
    sys.cpu.step();
    expect(sys.cpu.P.Z).toEqual(true);
  });
  it("should set N flag on lda", () => {
    const rom = generateRom([F.LdaImmediate, 0xef, F.LdaImmediate, 0x0f]);
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.N).toEqual(false);
    sys.cpu.step();
    expect(sys.cpu.P.N).toEqual(true);
    sys.cpu.step();
    expect(sys.cpu.P.N).toEqual(false);
  });
  it("should set N flag on lda long", () => {
    const rom = generateRom(
      make([F.EmulationOff, F.A16bit, F.LdaImmediate, 0x00, 0x83])
    );
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.N).toEqual(false);
    sys.cpu.step(4);
    expect(sys.cpu.P.N).toEqual(true);
    expect(sys.cpu.A.word).toEqual(0x8300);
  });
});

describe("Opcodes", () => {
  it("lda direct page: 0xA5", () => {
    const rom = generateRom([F.LdaDP, 0x05, F.LdaDP, 0x06]);
    const sys = new System(rom);

    sys.cpu.reset();

    // Inject RAM for testing
    sys.write(0x0005, 0x42);
    sys.write(0x0006, 0x69);

    sys.cpu.step();
    expect(sys.cpu.A.byte).toEqual(0x42);
    sys.cpu.step();
    expect(sys.cpu.A.byte).toEqual(0x69);
  });
  it("lda direct page: 0xA5 - 16bit", () => {
    const rom = generateRom(
      make([F.EmulationOff, F.A16bit, F.LdaDP, 0x05, F.LdaDP, 0x42])
    );
    const sys = new System(rom);

    sys.cpu.reset();

    // Inject RAM for testing
    sys.write(0x0005, 0x42);
    sys.write(0x0006, 0x69);
    sys.write(0x0042, 0x34);
    sys.write(0x0043, 0x12);

    sys.cpu.step(4);
    expect(sys.cpu.A.word).toEqual(0x6942);
    sys.cpu.step();
    expect(sys.cpu.A.word).toEqual(0x1234);
  });
  it("lda immediate: 0xA9", () => {
    const rom = generateRom([F.LdaImmediate, 0x42]);
    const sys = new System(rom);

    sys.cpu.reset();
    sys.cpu.step();

    expect(sys.cpu.A.byte).toEqual(0x42);
    expect(sys.cpu.A.word).toEqual(0x42);
  });
  it("lda immediate: 0xA9 - emulation off", () => {
    const rom = generateRom(make([F.EmulationOff, F.LdaImmediate, 0x42]));
    const sys = new System(rom);

    sys.cpu.reset();
    expect(sys.cpu.P.C).toEqual(false);
    expect(sys.cpu.E).toEqual(true);

    sys.cpu.step(); // 0x18
    expect(sys.cpu.P.C).toEqual(false);
    sys.cpu.step(); // 0xfb
    expect(sys.cpu.E).toEqual(false);

    sys.cpu.step(); //0xa9, 0x42
    expect(sys.cpu.A.byte).toEqual(0x42);
    expect(sys.cpu.A.word).toEqual(0x42);
  });
  it("lda immediate: 0xA9 - 16bit to 8bit", () => {
    const rom = generateRom(
      make([
        F.EmulationOff,
        F.A16bit,
        F.LdaImmediate,
        0x42,
        0x69,
        F.A8bit,
        F.LdaImmediate,
        0xba,
      ])
    );
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

    sys.cpu.step(); // 0xe2, 0x20
    expect(sys.cpu.P.M).toEqual(true);

    sys.cpu.step(); // 0xa9, 0xba
    expect(sys.cpu.A.byte).toEqual(0xba);
  });
});
