import { serializeData, serializeError } from './resp-v2-serializer.ts';
import { DataType } from './types.ts';

type ServerAction = (data: DataType[]) => void;

export default function ServerHandler({
  database,
  socketWrite,
}: {
  database: Map<string, DataType>;
  socketWrite: (data: string) => void;
}) {
  const sendError = (message: string) => socketWrite(serializeError(message));

  const ping: ServerAction = (data: DataType[]) => {
    socketWrite('+PONG\r\n');
    for (const object of data) {
      if (typeof object === 'string' && object.toLowerCase() === 'ping') socketWrite('+PONG\r\n');
    }
  };

  const echo: ServerAction = (data: DataType[]) => {
    const response = serializeData(data.length === 1 ? data[0] : data);
    socketWrite(response);
  };

  const set: ServerAction = (data: DataType[]) => {
    if (data.length !== 2) return sendError('Invalid number of arguments to set command');

    const [key, value] = data;
    if (typeof key !== 'string') return sendError('Invalid key argument');

    if (typeof value !== 'string' && typeof value !== 'number') {
      sendError('Invalid value argument');
    }

    database.set(key, value);
    socketWrite('+OK\r\n');
  };

  const get: ServerAction = (data: DataType[]) => {
    if (data.length !== 1) return sendError('Invalid number of arguments to get command');

    const key = data[0];
    if (typeof key !== 'string') return sendError('Invalid key argument');

    const value = database.get(key);
    if (value === undefined) return socketWrite('$-1\r\n');

    socketWrite(serializeData(value));
  };

  const runServerCommand = (command: string, data: DataType[]) => {
    switch (command.toLowerCase()) {
      case 'ping': {
        ping(data);
        break;
      }
      case 'echo': {
        echo(data);
        break;
      }
      case 'set': {
        set(data);
        break;
      }
      case 'get': {
        get(data);
        break;
      }
      default: {
        sendError('Unknown command');
      }
    }
  };

  return runServerCommand;
}
