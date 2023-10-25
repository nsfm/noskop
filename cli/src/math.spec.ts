import { lerp, distance } from "./math";

describe("Math", () => {
  it("should lerp", () => {
    expect(lerp(0, 10, 0.5)).toEqual(5);
    expect(lerp(0, 10, 0.25)).toEqual(2.5);
  });

  it("should calculate distance", () => {
    expect(distance(10)).toEqual(10);
    expect(distance(10, 0)).toEqual(10);
    expect(distance(10, 0, 0)).toEqual(10);
    expect(distance(0, 10, 0)).toEqual(10);
    expect(distance(0, 0, 10)).toEqual(10);
    expect(distance(0, 0, 10, 0)).toEqual(10);
    expect(distance(10, 10)).toBeCloseTo(14.14);
    expect(distance(10, 5)).toBeCloseTo(11.18);
  });
});
