import * as net from 'node:net';

import RESPV2Parser from '../resp-v2-parser.ts';
import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DatabaseValue } from '../types.ts';
import ServerHandler from './handler.ts';

export default class ServerListener {
  database: Map<string, DatabaseValue>;
  socket: net.Socket;
  serverHandler: ServerHandler;

  constructor(socket: net.Socket) {
    this.socket = socket;
    this.database = new Map<string, DatabaseValue>();
    this.serverHandler = new ServerHandler({
      database: this.database,
      socketWrite: (data: string) => socket.write(data),
    });
  }

  public listen() {
    this.socket.on('data', this.onSocketData.bind(this)).on('error', (error) => console.error(error));
  }

  private onSocketData(buffer: Buffer) {
    try {
      const parsedBuffer = RESPV2Parser.parse(buffer.toString());

      if (parsedBuffer === undefined)
        return this.sendError('Parser returns nothing. Please provide a valid RESPv2 data.');
      if (!Array.isArray(parsedBuffer)) return this.sendError('Invalid data. Please provide a valid RESPv2 array.');
      if (typeof parsedBuffer[0] !== 'string') return this.sendError('Command should be a string.');

      const [operation, ...data] = parsedBuffer;
      this.serverHandler.run(operation, data);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) return this.sendError('ERROR: ' + error.message);
    }
  }

  private sendError(message: string) {
    this.socket.write(RESPV2Serializer.serializeError(message));
  }
}
