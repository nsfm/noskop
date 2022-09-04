import WebSocket, { Server } from "ws";
import Logger from "bunyan";

export interface ServerParams {
  logger?: Logger;
}

interface Client extends WebSocket {
  id: symbol;
}

export interface Event {
  type: string;
}

export class Radio {
  private wss: Server<Client>;

  log: Logger;

  constructor({ logger }: ServerParams) {
    this.wss = new Server<Client>({
      port: 9890,
      backlog: 64,
      clientTracking: true,
    });

    this.log =
      logger?.child({ module: "Server" }) ||
      Logger.createLogger({
        name: "Server",
        level: "debug",
      });

    this.setup();
  }

  /**
   * Sets up websocket server and client subscriptions.
   */
  private setup() {
    this.wss.on("connection", (ws: Client) => {
      this.log.info("New client", { clients: this.wss.clients.size });
      ws.id = Symbol();
      ws.on("pong", () => {
        this.heartbeats.set(ws.id, true);
      });
    });

    this.wss.on("error", (err: Error) => {
      this.log.warn("Server error", { err });
    });

    setInterval(() => {
      this.wss.clients.forEach((ws: Client) => {
        if (this.heartbeats.get(ws.id) === false) return ws.terminate();
        this.heartbeats.set(ws.id, false);
        ws.ping();
      });
    }, 1000);
  }

  /**
   * Tracks client connection statuses.
   */
  private heartbeats = new Map<symbol, boolean>();

  /**
   * Broadcasts an event to all clients.
   */
  public broadcast(event: Event) {
    this.wss.clients.forEach((client: Client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event), { binary: false });
      }
    });
  }
}
