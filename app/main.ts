import * as net from "node:net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

function serverListener(connection: net.Socket) {
    connection.on("data", function onConnection(data: Buffer) {
      data ? connection.write(data) : connection.write("+PONG\r\n");
    });
}

const server: net.Server = net.createServer(serverListener);

server.listen(6379, "127.0.0.1");   

