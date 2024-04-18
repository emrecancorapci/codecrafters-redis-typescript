import * as net from 'node:net';

import getPort from './server/arguments/get-port.ts';
import getReplicaOf from './server/arguments/get-replicaof.ts';
import MasterServerListener from './server/master-server-listener.ts';
import ServerListener from './server/server-listener.ts';

const PORT = getPort();

const server: net.Server = net
  .createServer()
  .on('connection', (socket) => {
    console.log(`New connection from`, socket.remoteAddress, socket.remotePort);
    const master = getReplicaOf();

    if (!master) return;

    const masterListener = new MasterServerListener(master.host, master.port, socket);
    masterListener.performHandshake();
  })
  .on('connection', (socket) => {
    console.log(`New connection from`, socket.remoteAddress, socket.remotePort);
    const serverListener = new ServerListener(socket);
    serverListener.listen();
  })
  .on('error', (error) => console.error(error));

server.listen(PORT, '127.0.0.1').on('listening', () => console.log(`Server listening on port ${PORT}`));
