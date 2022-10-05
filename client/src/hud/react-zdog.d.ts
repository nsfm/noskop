declare module "react-zdog" {
  import React from "react";
  import zdog from "zdog";

  export function useZdog(): {
    illu: zdog.Illustration;
    scene: zdog.Anchor;
    size: { left: number; top: number; width: number; height: number };
  };

  export function useRender(...args: unknown): unknown;

  export const Illustration: React.FunctionComponent<
    React.PropsWithChildren<{
      scene?: zdog.Anchor;
      illu?: zdog.Illustration;
      size?: unknown;
      element: "svg" | "canvas";
      zoom?: number;
    }>
  >;

  export const Anchor: React.forwardRef<zdog.Anchor>;
  export const Shape: React.forwardRef<zdog.Shape>;
  export const Group: React.forwardRef<zdog.Group>;
  export const Rect: React.forwardRef<zdog.Rect>;
  export const RoundedRect: React.forwardRef<zdog.RoundedRect>;
  export const Ellipse: React.forwardRef<zdog.Ellipse>;
  export const Polygon: React.forwardRef<zdog.Polygon>;
  export const Hemisphere: React.forwardRef<zdog.Hemisphere>;
  export const Cylinder: React.forwardRef<zdog.Cylinder>;
  export const Cone: React.forwardRef<zdog.Cone>;
  export const Box: React.forwardRef<zdog.Box>;
}
