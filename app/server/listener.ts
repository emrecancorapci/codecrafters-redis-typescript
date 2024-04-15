import * as net from 'node:net';

import RESPV2Parser from '../resp-v2-parser.ts';
import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DatabaseValue } from '../types.ts';
import ServerHandler from './handler.ts';

export default function serverListener(socket: net.Socket) {
  const database = new Map<string, DatabaseValue>();

  const sendError = (message: string) => {
    socket.write(RESPV2Serializer.serializeError(message));
  };
  const socketWrite = (data: string) => {
    socket.write(data);
  };

  const serverHandler = new ServerHandler({ database, socketWrite });
  socket.on('data', function socketOn(buffer: Buffer) {
    try {
      const parsedBuffer = RESPV2Parser.parse(buffer.toString());

      if (parsedBuffer === undefined) return sendError('Parser returns nothing. Please provide a valid RESPv2 data.');
      if (!Array.isArray(parsedBuffer)) return sendError('Invalid data. Please provide a valid RESPv2 array.');
      if (typeof parsedBuffer[0] !== 'string') return sendError('Command should be a string.');

      const [operation, ...data] = parsedBuffer;
      serverHandler.run(operation, data);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) return sendError('ERROR: ' + error.message);
    }
  });
}
