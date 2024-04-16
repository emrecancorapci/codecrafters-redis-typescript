import * as net from 'node:net';

import RESPV2Parser from '../resp-v2-parser.ts';
import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DatabaseValue, DataType } from '../types.ts';
import getReplicaOf from './arguments/get-replicaof.ts';
import ServerHandler from './handler.ts';

export default class ServerListener {
  private readonly database: Map<string, DatabaseValue>;
  private readonly master: { host: string; port: number } | undefined;
  private readonly socket: net.Socket;
  private readonly serverHandler: ServerHandler;

  constructor(socket: net.Socket) {
    this.database = new Map<string, DatabaseValue>();
    this.socket = socket;

    this.serverHandler = new ServerHandler({
      database: this.database,
      socketWrite: (data: string) => socket.write(data),
    });

    this.master = getReplicaOf();
  }

  public listen(): void {
    this.performHandshake();
    this.socket.on('data', this.onSocketData.bind(this)).on('error', (error) => console.error(error));
  }

  private performHandshake(): void {
    if (!this.master) return;

    this.socket.connect(this.master.port, this.master.host, () => {
      this.socket.write(RESPV2Serializer.serializeArray(['PING']));
      this.socket.on('data', this.onHandshakeData.bind(this));
    });
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

  private onHandshakeData(buffer: Buffer): void {
    if (!this.master) return;

    const parsedBuffer = this.parseBuffer(buffer);
    if (parsedBuffer === undefined) return;
    const { operation } = parsedBuffer;

    if (operation === 'PONG') {
      this.socket.write(RESPV2Serializer.serializeArray(['REPLICAOF', 'listening-port', this.master.port.toString()]));
      this.socket.write(RESPV2Serializer.serializeArray(['REPLICAOF', 'capa', 'psync2']));
    } else {
      return this.sendError('Invalid response from master');
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
