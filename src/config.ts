import { StepperConfig, MovementConfig } from "./marlin";

export const stepperConfigs: StepperConfig[] = [
  {
    axis: "X",
    port: 0,
    name: "Stage (X)",
    steps: 200,
    invert: false,
    max: {
      jerk: 100,
      acceleration: 1000,
      feedrate: 1600,
    },
  },
  {
    axis: "Y",
    port: 1,
    name: "Stage (Y)",
    steps: 200, // 100 -> 1/4 turn for 0.9 degree steppers
    invert: false,
    max: {
      jerk: 100,
      acceleration: 1000,
      feedrate: 1600,
    },
  },
  {
    axis: "Z",
    port: 2,
    name: "Focus Control (Z)",
    steps: 10,
    invert: false,
    max: {
      jerk: 1,
      acceleration: 20,
      feedrate: 40,
    },
  },
  {
    axis: "E",
    port: 4,
    name: "Turret Control",
    steps: 50, // 50 -> 1/4 turn for 1.8 degree steppers
    invert: false,
    max: {
      jerk: 10,
      acceleration: 200,
      feedrate: 100,
    },
  },
];

export const movementConfig: MovementConfig = {
  minFeedrate: 0.001,
  maxFeedrate: 1000,
  maxAcceleration: 1000,
  maxJerk: 100,
  inactivityShutdown: 300,
  steppers: stepperConfigs,
};
