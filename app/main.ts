import * as net from "node:net";
import { respV2ErrorUnparser, respV2Parser, respV2Unparser } from "./resp-v2-parser";

async function serverListener(socket: net.Socket) {
  socket.on('data', function serverHandler(data: Buffer) {
    const dataObject = respV2Parser(data.toString());
    console.log(dataObject)
  
    if (dataObject === undefined) {
      const error = respV2ErrorUnparser("Invalid data");
      socket.write(error);
      return;
    }
  
    if (Array.isArray(dataObject)) {
      switch (dataObject[0]) {
        case 'ping':
          dataObject.forEach((object) => {
            if (typeof object === 'string' && object.toLowerCase() === 'ping') socket.write('+PONG\r\n');
          })
          break;
        case 'echo':
          const response = respV2Unparser(dataObject.slice(1));
          console.log(response);
          socket.write(response);
          break;
        default:
          socket.write(respV2ErrorUnparser("Invalid operation"));
      }
    }
  });
}



const server: net.Server = net.createServer(serverListener).on('connection', socket =>
  console.log(`new connection from`, socket.remoteAddress, socket.remotePort
  )).on('error', err => console.error(err));

server.listen(6379, "127.0.0.1");

