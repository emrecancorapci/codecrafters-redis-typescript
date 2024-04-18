import * as net from 'node:net';

import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import getReplicaOf from './arguments/get-replicaof.ts';
import ServerHandler from './handler.ts';
import { parseBuffer } from './helpers/parse-buffer.ts';
import MasterServerListener from './master-server-listener.ts';
import { DatabaseValue } from './types.ts';

export default class ServerListener {
  private readonly database: Map<string, DatabaseValue<RESPv2Data>>;
  private readonly socket: net.Socket;

  private readonly serverHandler: ServerHandler;
  private readonly masterListener: MasterServerListener | undefined;

  constructor(socket: net.Socket) {
    this.database = new Map<string, DatabaseValue<RESPv2Data>>();
    this.socket = socket;

    this.serverHandler = new ServerHandler({
      database: this.database,
      socketWrite: (data: string) => socket.write(data),
    });

    const master = getReplicaOf();
    console.log(Date.now(), '| Master server:', master);

    if (master) this.masterListener = new MasterServerListener(master.host, master.port);
    console.log(Date.now(), '| Server listener created.');
  }

  public listen(): void {
    console.log(Date.now(), '| Starting to perform handshake.');
    if (this.masterListener) this.masterListener.performHandshake();
    console.log(Date.now(), '| Handshake completed. Listening for incoming data.');
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
