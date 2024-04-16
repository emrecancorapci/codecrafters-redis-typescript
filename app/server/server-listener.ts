import * as net from 'node:net';

import RESPV2Parser from '../resp-v2-parser.ts';
import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DatabaseValue, DataType } from '../types.ts';
import ServerHandler from './handler.ts';

export default class ServerListener {
  private readonly database: Map<string, DatabaseValue>;
  private readonly socket: net.Socket;
  private readonly serverHandler: ServerHandler;

  constructor(socket: net.Socket) {
    this.database = new Map<string, DatabaseValue>();
    this.socket = socket;

    this.serverHandler = new ServerHandler({
      database: this.database,
      socketWrite: (data: string) => socket.write(data),
    });
  }

  public listen(): void {
    this.socket.on('data', this.onSocketData.bind(this)).on('error', (error) => console.error(error));
  }

  private onSocketData(buffer: Buffer): void {
    try {
      const parsedBuffer = this.parseBuffer(buffer);
      if (parsedBuffer === undefined) return;

      const { operation, data } = parsedBuffer;
      this.serverHandler.run(operation, data);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) return this.sendError('ERROR: ' + error.message);
    }
  }

  private parseBuffer(buffer: Buffer): ParseServerBuffer {
    const parsedBuffer = RESPV2Parser.parse(buffer.toString());

    if (parsedBuffer === undefined) {
      this.sendError('Parser returns nothing. Please provide a valid RESPv2 data.');
      return;
    }
    if (!Array.isArray(parsedBuffer)) {
      this.sendError('Invalid data. Please provide a valid RESPv2 array.');
      return;
    }
    if (typeof parsedBuffer[0] !== 'string') {
      this.sendError('Command should be a string.');
      return;
    }

    return { operation: parsedBuffer[0], data: parsedBuffer.slice(1) };
  }

  private sendError(message: string): void {
    this.socket.write(RESPV2Serializer.serializeError(message));
  }
}

type ParseServerBuffer = { operation: string; data: DataType[] } | undefined;
