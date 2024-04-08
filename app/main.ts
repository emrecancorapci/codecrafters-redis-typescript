import * as net from "node:net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

async function serverListener(connection: net.Socket) {
    // connection is a Socket object that can be used to read and write data from the client
    // connection.on is used to register a callback that will be called when data is received from the client
    connection.on("data", async function onConnection(data: Buffer) {
      // connection.write is used to write data to the client
      connection.write("+PONG\r\n");
    });
}

const server: net.Server = net.createServer(serverListener);

server.listen(6379, "127.0.0.1");   

