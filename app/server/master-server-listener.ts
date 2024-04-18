import * as net from 'node:net';

import RESPv2 from '../protocols/resp-v2.ts';
import { parseBuffer } from './helpers/parse-buffer.ts';

export default class MasterServerListener {
  private readonly socket: net.Socket;
  private readonly host: string;
  private readonly port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.socket = new net.Socket();
  }

  public performHandshake(): void {
    this.socket.connect(this.port, this.host, () => {
      this.socket.write(RESPv2.serializeArray(['PING']));
      this.socket.on('data', this.onHandshakeData.bind(this));
    });
  }

  private onHandshakeData(buffer: Buffer): void {
    const parsedBuffer = parseBuffer(buffer);
    if ('error' in parsedBuffer) return this.sendError(parsedBuffer.error);
    const { operation } = parsedBuffer;

    this.socket.write(RESPv2.serializeArray(['PING']));

    if (operation === 'PONG') {
      this.socket.write(RESPv2.serializeArray(['REPLICAOF', 'listening-port', this.port.toString()]));
      this.socket.write(RESPv2.serializeArray(['REPLICAOF', 'capa', 'psync2']));
    } else {
      return this.sendError('Invalid response from master');
    }
  }

  private sendError(message: string): void {
    this.socket.write(RESPv2.serializeError(message));
  }
}
