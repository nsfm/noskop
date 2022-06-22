/**
 * Scales values from one range to another.
 */
export function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

/**
 * Calculates distance to a point, relative to [0,0].
 */
export function distance(...coordinates: number[]): number {
  return Math.sqrt(
    coordinates.reduce((acc: number, coordinate: number): number => {
      return acc + Math.pow(coordinate, 2);
    }, 0)
  );
}
