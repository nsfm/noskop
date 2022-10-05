import React from "react";
import { Rect, Shape } from "react-zdog";

export interface ScaleState {
  offset: { x?: number; y?: number };
  thickness: number;
  parallax: number;
  width: number;
  ticks: number;
  bigTickInterval: number;
  bigTickMagnitude: number;
  tickHeight: number;
  direction: "x" | "y";
}

export type ScaleProps = Partial<ScaleState>;

/**
 * Measures position on one axis.
 */
export const Scale = (props: ScaleProps) => {
  const [state, setState] = React.useState<ScaleState>({
    offset: { x: 0, y: 0 },
    thickness: 0.07,
    parallax: 0.1,
    width: 40,
    ticks: 31,
    bigTickInterval: 5,
    bigTickMagnitude: 2,
    tickHeight: 1,
    direction: "y",
    ...props,
  });

  const tickInterval = state.width / (state.ticks - 1);
  const tickDimensions = (i: number) => ({
    [state.direction === "x" ? "width" : "height"]: state.thickness,
    [state.direction === "x" ? "height" : "width"]:
      state.tickHeight +
      (i % state.bigTickInterval === 0
        ? state.tickHeight * state.bigTickMagnitude
        : 0),
  });

  return (
    <Shape stroke={0}>
      <Rect
        stroke={state.thickness}
        width={state.direction === "x" ? state.width : state.thickness}
        height={state.direction === "x" ? state.thickness : state.width}
        translate={state.offset}
        color="orange"
      />
      {Array(state.ticks)
        .fill("")
        .map((val, i) => (
          <Rect
            stroke={state.thickness}
            translate={{
              ...state.offset,
              [state.direction]:
                (state.offset[state.direction] || 0) -
                state.width / 2 +
                tickInterval * i,
            }}
            color="orange"
            {...tickDimensions(i)}
          />
        ))}
    </Shape>
  );
};
