import WebSocket, { WebSocketServer } from "ws";
import Logger from "bunyan";

class Client extends WebSocket {
  id: symbol = Symbol();
}

function isClient(value: WebSocket | Client): value is Client {
  return "id" in value;
}

export interface Event<T> {
  type: string;
  data: T;
}

export interface RadioParams {
  logger?: Logger;
}

export class Radio {
  private wss: WebSocketServer;

  log: Logger;

  constructor({ logger }: RadioParams) {
    this.wss = new WebSocketServer({
      port: 9890,
      backlog: 64,
      clientTracking: true,
      WebSocket: Client,
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
      ws.on("pong", () => {
        this.heartbeats.set(ws.id, true);
      });
    });

    this.wss.on("error", (err: Error) => {
      this.log.warn("Server error", { err });
    });

    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        if (!isClient(ws)) throw new Error("Bad websocket client");
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
  public broadcast(event: Event<unknown>) {
    this.wss.clients.forEach((client: WebSocket) => {
      if (!isClient(client)) throw new Error("Bad websocket client");
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event), { binary: false });
      }
    });
  }
}
