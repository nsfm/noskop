import React from "react";
import { Rect, Shape } from "react-zdog";

// TODO Convert this into a scale for measuring at the current magnification
// TODO Nice transitions between different magnifications / configs

export interface GraduatedRuleState {
  offset: { x?: number; y?: number };
  direction: "x" | "y";
  length: number;
  thickness: number;
  gradation: {
    count: number;
    length: number;
    thickness: number;
  };
  majorGradations: [{ interval: number; magnitude: number }];
}

export type GraduatedRuleProps = Partial<GraduatedRuleState>;

/**
 * Provides a ruler for measuring scale.
 */
export const GraduatedRule = (props: GraduatedRuleProps) => {
  const [state] = React.useState<GraduatedRuleState>({
    offset: { x: 0, y: 0 },
    direction: "y",
    length: 200,
    thickness: 1,
    gradation: { count: 31, length: 5, thickness: 1 },
    majorGradations: [{ interval: 5, magnitude: 2 }],
    ...props,
  });

  const gradInterval = state.length / (state.gradation.count - 1);

  // The baseline
  const spine = (
    <Rect
      stroke={state.thickness}
      width={state.direction === "x" ? state.length : state.thickness}
      height={state.direction === "x" ? state.thickness : state.length}
      translate={state.offset}
      color="orange"
    />
  );
  // The gradations
  const vertebrae = Array<GraduatedRuleState>(state.gradation.count)
    .fill(state)
    .map(({ gradation, majorGradations, thickness, direction, offset }, i) => {
      const gradLength = majorGradations.map(
        ({ interval, magnitude }, length) =>
          length * (i % interval === 0 ? magnitude : 1),
        gradation.length
      );
      const gradDimensions = {
        [direction === "x" ? "width" : "height"]: thickness,
        [direction === "x" ? "height" : "width"]: gradLength,
      };

      return (
        <Rect
          key={i}
          stroke={thickness}
          translate={{
            ...offset,
            [direction]:
              (offset[direction] || 0) - gradation.length + gradInterval * i,
          }}
          color="orange"
          {...gradDimensions}
        />
      );
    });

  return (
    <Shape stroke={0}>
      {spine}
      {vertebrae}
    </Shape>
  );
};
