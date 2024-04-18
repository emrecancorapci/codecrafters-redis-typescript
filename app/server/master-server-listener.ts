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
    this.socket = new net.Socket({ allowHalfOpen: true, readable: true, writable: true });
    console.log(Date.now() + '| Master server listener created.');
  }

  public performHandshake(): void {
    console.log(Date.now() + '| Connecting to master server.');
    this.socket.connect(this.port, this.host, () => {
      console.log(Date.now() + '| Connected to master server. Sending PING request.');
      this.socket.write(RESPv2.serializeArray(['PING']));
      console.log(Date.now() + '|PING request sent. Waiting for response.');
      this.socket.on('data', this.onHandshakeData.bind(this));
    });
  }

  private onHandshakeData(buffer: Buffer): void {
    const parsedBuffer = parseBuffer(buffer);
    if ('error' in parsedBuffer) return this.sendError(parsedBuffer.error);
    const { operation } = parsedBuffer;

    if (operation === 'PONG') {
      console.log(Date.now() + '| Received PONG response. Sending REPLICAOF request.');
      this.socket.write(RESPv2.serializeArray(['REPLICAOF', 'listening-port', this.port.toString()]));
      this.socket.write(RESPv2.serializeArray(['REPLICAOF', 'capa', 'psync2']));
      console.log(Date.now() + '| REPLICAOF request sent. Waiting for response.');
    } else {
      return this.sendError('Invalid response from master');
    }
  }

  private sendError(message: string): void {
    this.socket.write(RESPv2.serializeError(message));
  }
}
