import * as net from 'node:net';

import RESPV2Serializer from './resp-v2-serializer.ts';
import getPort from './server/arguments/get-port.ts';
import getReplicaOf from './server/arguments/get-replicaof.ts';
import serverListener from './server/listener.ts';

const PORT = getPort();
const master = getReplicaOf();

if (master) {
  const client = new net.Socket();

  client.connect(master.port, master.host, () => {
    client.write(RESPV2Serializer.serializeMultiBulk(['PING']));
  });
}

const server: net.Server = net
  .createServer(serverListener)
  .on('connection', (socket) => console.log(`New connection from`, socket.remoteAddress, socket.remotePort))
  .on('error', (error) => console.error(error));

server.listen(PORT, '127.0.0.1').on('listening', () => console.log(`Server listening on port ${PORT}`));
