import React from "react";
import { Rect, Shape } from "react-zdog";

export interface ScaleState {
  offset: { x: number; y: number };
  thickness: number;
  parallax: number;
  width: number;
  ticks: number;
  bigTickInterval: number;
  bigTickMagnitude: number;
  tickHeight: number;
  direction: "x" | "y";
}

/**
 * Measures position on one axis.
 */
export const Scale = () => {
  const [state, setState] = React.useState<ScaleState>({
    offset: { x: 0, y: -15 },
    thickness: 0.09,
    parallax: 0.1,
    width: 40,
    ticks: 31,
    bigTickInterval: 5,
    bigTickMagnitude: 2,
    tickHeight: 1,
    direction: "x",
  });

  const tickInterval = state.width / (state.ticks - 1);

  return (
    <Shape stroke={0}>
      <Rect
        stroke={state.thickness}
        width={state.width}
        height={state.thickness}
        translate={state.offset}
        color="orange"
      />
      {Array(state.ticks)
        .fill("")
        .map((val, i) => (
          <Rect
            stroke={state.thickness}
            width={state.thickness}
            height={
              state.tickHeight +
              (i % state.bigTickInterval === 0
                ? state.tickHeight * state.bigTickMagnitude
                : 0)
            }
            translate={{
              ...state.offset,
              [state.direction]:
                state.offset[state.direction] -
                state.width / 2 +
                tickInterval * i,
            }}
            color="orange"
          />
        ))}
    </Shape>
  );
};
