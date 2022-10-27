import { GraphQLFloat, GraphQLObjectType } from "graphql";

export const Position = new GraphQLObjectType({
  name: "Position",
  fields: {
    x: { type: GraphQLFloat },
    y: { type: GraphQLFloat },
    z: { type: GraphQLFloat },
  },
});
