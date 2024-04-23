import * as net from 'node:net';

import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import getReplicaOf from './arguments/get-replicaof.ts';
import { parseBuffer } from './helpers/parse-buffer.ts';
import ServerHandler from './server-handler.ts';
import { DatabaseValue } from './types.ts';

export default class ServerListener {
  private readonly database: Map<string, DatabaseValue<RESPv2Data>>;
  private readonly socket: net.Socket;

  private readonly serverHandler: ServerHandler;

  constructor(socket: net.Socket) {
    this.database = new Map<string, DatabaseValue<RESPv2Data>>();
    this.socket = socket;

    this.serverHandler = new ServerHandler(this.database, (data: string) => socket.write(data));
    const master = getReplicaOf();
    if (master) {
      this.socket.connect(master.port, master.host, () => {
        this.socket.write(RESPv2.serializeArray(['PING']));
      });
    }

    console.log(Date.now(), '| Server listener created.');
  }

  public listen(): void {
    this.socket.on('data', this.onSocketData.bind(this)).on('error', (error) => console.error(error));
  }

  private onSocketData(buffer: Buffer): void {
    try {
      const parsedBuffer = parseBuffer(buffer);
      if ('error' in parsedBuffer) return this.sendError(parsedBuffer.error);

      const { operation, data } = parsedBuffer;
      this.serverHandler.run(operation, data);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) return this.sendError('ERROR: ' + error.message);
    }
  }

  private sendError(message: string): void {
    this.socket.write(RESPv2.serializeError(message));
  }
}
