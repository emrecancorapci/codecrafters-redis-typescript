import * as net from 'node:net';

import getPort from './server/arguments/get-port.ts';
import serverListener from './server/listener.ts';

const PORT = getPort();

const server: net.Server = net
  .createServer(serverListener)
  .on('connection', (socket) => console.log(`New connection from`, socket.remoteAddress, socket.remotePort))
  .on('error', (error) => console.error(error));

server.listen(PORT, '127.0.0.1').on('listening', () => console.log(`Server listening on port ${PORT}`));
