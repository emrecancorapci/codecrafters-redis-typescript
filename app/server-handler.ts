import { serializeData, serializeError } from './resp-v2-serializer.ts';
import { DatabaseValue, DataType } from './types.ts';

type ServerAction = (data: DataType[]) => void;

export default function ServerHandler({
  database,
  socketWrite,
}: {
  database: Map<string, DatabaseValue>;
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
    if (data.length < 2) return sendError('Invalid number of arguments to set command');
    const [key, value, ...setArguments] = data;

    if (typeof key !== 'string') return sendError('Invalid key argument');
    if (typeof value !== 'string' && typeof value !== 'number') return sendError('Invalid value argument');

    if (data.length === 2) {
      database.set(key, { value, expires: -1 });
      return socketWrite('+OK\r\n');
    }

    if (data.length === 4) {
      const [argument, argumentValue] = setArguments;

      if (typeof argument !== 'string') return sendError('Invalid set argument');
      if (argument.toLowerCase() === 'px' && typeof argumentValue === 'number' && argumentValue > 0) {
        database.set(key, { value, expires: Date.now() + argumentValue });
        return socketWrite('+OK\r\n');
      }
    }

    return sendError('Invalid number of arguments to set command');
  };

  const get: ServerAction = (data: DataType[]) => {
    if (data.length !== 1) return sendError('Invalid number of arguments to get command');

    const key = data[0];
    if (typeof key !== 'string') return sendError('Invalid key argument');

    const databaseValue = database.get(key);
    if (databaseValue === undefined) return socketWrite('$-1\r\n');

    if (databaseValue.expires !== -1 && databaseValue.expires < Date.now()) {
      database.delete(key);
      return socketWrite('$-1\r\n');
    }

    socketWrite(serializeData(databaseValue.value));
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
