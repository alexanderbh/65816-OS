import { System } from "../system";

describe("Can read RAM", () => {
  it("should read write ram", () => {
    const sys = new System();
    sys.write(42, 88);

    expect(sys.read(42)).toEqual(88);
  });

  it("should read 0 from empty ram", () => {
    const sys = new System();

    expect(sys.read(42)).toEqual(0);
  });
});
