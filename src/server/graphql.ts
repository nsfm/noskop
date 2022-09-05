import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLList,
} from "graphql";

import { Position } from "./graphql/position";
import { Settings } from "./graphql/settings";
import { Stepper } from "./graphql/stepper";
import { Fan } from "./graphql/fan";

const Status = new GraphQLEnumType({
  name: "Status",
  description: "Describes the result of a request",
  values: {
    OK: { value: "ok", description: "The request was successful" },
    FAILED: {
      value: "failed",
      description: "The request could not be completed",
    },
    REJECTED: {
      value: "rejected",
      description: "There are too many pending requests",
    },
  },
});

const MovementMode = new GraphQLEnumType({
  name: "MovementMode",
  description: "Describes how the machine interprets travel actions",
  values: {
    RELATIVE: {
      value: "relative",
      description: "Travel values are literal coordinates",
    },
    ABSOLUTE: {
      value: "absolute",
      description: "Travel values are relative to current position",
    },
  },
});

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    // Settings
    movementPrecision: {
      type: Status,
      description: "Adjust movement precision (millimeters)",
    },
    stepsPerMillimeter: {
      type: Status,
      description: "Adjust steps per millimeter (count)",
    },
    temperatureInterval: {
      type: GraphQLInt,
      description: "Adjust temperature reading frequency (seconds)",
    },
    positionInterval: {
      type: GraphQLInt,
      description: "Position update frequency (seconds)",
    },

    // Movement
    stop: {
      type: Status,
      description: "Immediately stop all movement",
    },
    travel: {
      type: Status,
      description: "Move in a straight line",
    },
    arc: {
      type: Status,
      description: "Move in an arc",
    },
    home: {
      type: Status,
      description: "Home the machine using the endstop switches",
    },

    // Fans
    setFan: {
      type: Status,
      description: "Set a fan's speed",
    },
    disableFan: {
      type: Status,
      description: "Turn off a fan",
    },

    // Probe
    deployProbe: {
      type: Status,
      description: "Deploy the BLTouch probe",
    },
    stowProbe: {
      type: Status,
      description: "Put the BLTouch probe away",
    },
  },
});

const query = new GraphQLObjectType({
  name: "Query",
  fields: {
    settings: {
      type: Settings,
    },
    steppers: {
      type: new GraphQLList(Stepper),
    },
    fans: {
      type: new GraphQLList(Fan),
    },
  },
});

export const schema = new GraphQLSchema({ query, mutation });
