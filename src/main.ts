import "reflect-metadata";

import { buildSchema } from "type-graphql";
import { Container } from "typedi";

import { Noskop, StageResolver } from "./services";

async function main() {
  const schema = await buildSchema({
    resolvers: [StageResolver],
    container: Container,
  });

  const noskop = Container.get(Noskop);
  await noskop.setup();
}

await main();
