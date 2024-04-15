import * as net from 'node:net';

import { parseRespV2 } from './resp-v2-parser.ts';
import { serializeError } from './resp-v2-serializer.ts';
import ServerHandler from './server-handler.ts';
import { DatabaseValue } from './types.ts';

function serverListener(socket: net.Socket) {
  const database = new Map<string, DatabaseValue>();

  const sendError = (message: string) => {
    socket.write(serializeError(message));
  };
  const socketWrite = (data: string) => {
    socket.write(data);
  };

  const serverHandler = new ServerHandler({ database, socketWrite });
  socket.on('data', function socketOn(buffer: Buffer) {
    try {
      const parsedBuffer = parseRespV2(buffer.toString());

      if (parsedBuffer === undefined) {
        const error = serializeError('Parser returns nothing. Please provide a valid RESPv2 data.');
        socket.write(error);
        return;
      }

      if (!Array.isArray(parsedBuffer)) {
        const error = serializeError('Invalid data. Please provide a valid RESPv2 array.');
        socket.write(error);
        return;
      }

      const [operation, ...data] = parsedBuffer;

      if (typeof operation === 'string') {
        serverHandler.run(operation, data);
      } else {
        sendError('Command should be a string.');
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) sendError('ERROR: ' + error.message);
    }
  });
}

const server: net.Server = net
  .createServer(serverListener)
  .on('connection', (socket) => console.log(`New connection from`, socket.remoteAddress, socket.remotePort))
  .on('error', (error) => console.error(error));

server.listen(6379, '127.0.0.1');
