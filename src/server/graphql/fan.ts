import { GraphQLString, GraphQLFloat, GraphQLObjectType } from "graphql";

export const Fan = new GraphQLObjectType({
  name: "Fan",
  fields: {
    id: { type: GraphQLString },
    speed: { type: GraphQLFloat },
  },
});
