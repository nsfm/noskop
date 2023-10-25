import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql";

export const Stepper = new GraphQLObjectType({
  name: "Stepper",
  fields: {
    id: { type: GraphQLString },
    inverted: { type: GraphQLBoolean },
    stepsPerMillimeter: {
      type: GraphQLInt,
      description: "Number of stepper motor steps required to traverse 1mm",
      resolve() {
        return 20;
      },
    },
  },
});
