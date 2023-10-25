import { GraphQLObjectType, GraphQLFloat, GraphQLInt } from "graphql";

export const Settings = new GraphQLObjectType({
  name: "Settings",
  fields: {
    movementPrecision: {
      type: GraphQLFloat,
      description: "Smallest allowed increment of movement",
      resolve() {
        return 0.0;
      },
    },

    temperatureInterval: {
      type: GraphQLInt,
      description: "Temperature readings frequency, in seconds",
      resolve() {
        return 10;
      },
    },

    positionInterval: {
      type: GraphQLInt,
      description: "Position update frequency, in seconds",
      resolve() {
        return 10;
      },
    },
  },
});
