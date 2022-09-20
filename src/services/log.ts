import Logger from "bunyan";
import { Service } from "typedi";

export { default as Logger } from "bunyan";

@Service()
export class LogService {
  public log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  spawn(name: string): Logger {
    return this.log.child({ module: name });
  }
}
