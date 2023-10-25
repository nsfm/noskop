import Color from "color";

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export class LightSource {
  public dropoff: number = 1;
  public pixels: Pixel[] = [];

  constructor() {
    const color = Color.rgb(255, 255, 255);

    // Outer ring 14.75mm radius
    for (let i = 0; i < 12; i++) {
      this.pixels.push({
        x: Math.cos(((2 * Math.PI) / 12) * i),
        y: Math.sin(((2 * Math.PI) / 12) * i),
        color,
      });
    }

    // Inner ring 7.95mm radius
    for (let i = 0; i < 6; i++) {
      this.pixels.push({
        x: 0.855 * Math.cos(((2 * Math.PI) / 12) * i),
        y: 0.855 * Math.sin(((2 * Math.PI) / 12) * i),
        color,
      });
    }

    // Center LED
    this.pixels.push({ x: 0, y: 0, color });
  }

  /**
   * Manipulates shape of light output using analog input
   */
  fromAnalog(x: number, y: number): void {
    for (let i = 0; i < this.pixels.length; i++) {
      const { x: pixelX, y: pixelY, color } = this.pixels[i];
      this.pixels[i].color = color.lightness(
        Math.min(this.dropoff - Math.hypot(x - pixelX, y - pixelY), 1) * 100
      );
    }
  }

  /**
   * Illuminates the entire array
   */
  brightfield(): void {
    for (let i = 0; i < this.pixels.length; i++) {
      const { color } = this.pixels[i];
      this.pixels[i].color = color.lightness(100);
    }
  }

  /**
   * Disables LEDs that aren't along the edge of the array
   * TODO: Radius setting so you can set the number of layers of ring to enable
   */
  darkenCenter(): void {
    for (let i = 12; i < this.pixels.length; i++) {
      const { color } = this.pixels[i];
      this.pixels[i].color = color.lightness(100);
    }
  }

  /**
   * Illuminates the outer ring, disables the inner ring
   */
  darkfield(): void {
    this.brightfield();
    this.darkenCenter();
  }

  /**
   * Turn on only the LEDs on the left side of the array
   */
  left(): void {
    for (let i = 0; i < this.pixels.length; i++) {
      const { x, color } = this.pixels[i];
      this.pixels[i].color = color.lightness(x < 0 ? 100 : 0);
    }
    this.darkenCenter();
  }
  // TODO An arc instead of left right. How many LEDS to illuminate along the edge only, and what angle
}
