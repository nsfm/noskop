import "reflect-metadata";

import { buildSchema } from "type-graphql";
import { Container } from "typedi";

import { Noskop, StageResolver, LogService, ScopeService } from "./services";

async function main() {
  const { log } = Container.get(LogService);

  log.info("Schema setup...");
  const schema = await buildSchema({
    resolvers: [StageResolver],
    container: Container,
  });
  log.info(schema);

  const scope = Container.get(ScopeService);
  log.info(scope);

  const noskop = Container.get(Noskop);
  log.info(noskop);

  await noskop.setup();
}

await main();
