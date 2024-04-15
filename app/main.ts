import * as net from "node:net";
import { parseRespV2 } from "./resp-v2-parser.ts";
import { serializeError } from "./resp-v2-serializer.ts";
import { DataType } from "./types.ts";
import ServerHandler from "./serverHandler.ts";

async function serverListener(socket: net.Socket) {
  const database = new Map<string, DataType>();

  const sendError = (message: string) => {
    socket.write(serializeError(message));
  }
  const socketWrite = (data: string) => {
    socket.write(data);
  }

  const runServerCommand = ServerHandler({ database, socketWrite })
  socket.on('data', function serverHandler(buffer: Buffer) {
    try {
      const parsedBuffer = parseRespV2(buffer.toString());

      if (parsedBuffer === undefined) {
        const error = serializeError("Invalid data");
        socket.write(error);
        return;
      }

      if (!Array.isArray(parsedBuffer)) {
        const error = serializeError("Invalid data");
        socket.write(error);
        return;
      }

      const [operation, ...data] = parsedBuffer;

      if(typeof operation !== 'string') {
        sendError("Invalid command");
        return;
      }
      runServerCommand(operation, data);
    } catch (error) {
      console.error(error);
      sendError("ERROR: " + error.message);

    }
  });
}



const server: net.Server = net.createServer(serverListener).on('connection', socket =>
  console.log(`new connection from`, socket.remoteAddress, socket.remotePort
  )).on('error', err => console.error(err));

server.listen(6379, "127.0.0.1");

