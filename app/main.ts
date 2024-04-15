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

  const runServerCommand = ServerHandler({ database, socketWrite });
  socket.on('data', function serverHandler(buffer: Buffer) {
    try {
      const parsedBuffer = parseRespV2(buffer.toString());

      if (parsedBuffer === undefined) {
        const error = serializeError('Invalid data');
        socket.write(error);
        return;
      }

      if (!Array.isArray(parsedBuffer)) {
        const error = serializeError('Invalid data');
        socket.write(error);
        return;
      }

      const [operation, ...data] = parsedBuffer;

      if (typeof operation === 'string') {
        runServerCommand(operation, data);
      } else {
        sendError('Invalid command. Command should be a string.');
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) sendError('ERROR: ' + error.message);
    }
  });
}

const server: net.Server = net
  .createServer(serverListener)
  .on('connection', (socket) => console.log(`new connection from`, socket.remoteAddress, socket.remotePort))
  .on('error', (error) => console.error(error));

server.listen(6379, '127.0.0.1');
