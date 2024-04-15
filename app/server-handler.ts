import { serializeData, serializeError } from './resp-v2-serializer.ts';
import { DatabaseValue, DataType } from './types.ts';

type ServerAction = (data: DataType[]) => void;
type ServerHandler = (command: string, data: DataType[]) => void;

interface ServerHandlerProperties {
  database: Map<string, DatabaseValue>;
  socketWrite: (data: string) => void;
}

export default function ServerHandler({ database, socketWrite }: ServerHandlerProperties): ServerHandler {
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
    if (data.length < 2) return sendError('Not enough number of ARGUMENTs for SET. Data: ' + data.join(' '));
    const [key, value, ...setArguments] = data;

    if (typeof key !== 'string') return sendError('Invalid KEY for SET. Key: ' + key);
    if (typeof value !== 'string' && typeof value !== 'number')
      return sendError('Invalid VALUE for SET. Value: ' + value);

    if (data.length === 2) {
      database.set(key, { value, expires: -1 });
      return socketWrite('+OK\r\n');
    }

    if (data.length === 4) {
      const [argument, argumentValue] = setArguments;

      if (typeof argument !== 'string') return sendError('Invalid ARGUMENT type for SET. Argument: ' + argument);
      if (argument.toLowerCase() === 'px') {
        const expires = Number(argumentValue);
        if (Number.isNaN(expires) || expires < 0)
          return sendError('Invalid EXPIRES for SET. Expires: ' + argumentValue);

        database.set(key, { value, expires: Date.now() + expires });
        return socketWrite('+OK\r\n');
      } else {
        return sendError('Invalid ARGUMENT pair for SET. Argument: ' + argument + ' Value: ' + argumentValue);
      }
    }

    return sendError('Invalid number of ARGUMENTs for SET. Data: ' + data.join(' '));
  };

  const get: ServerAction = (data: DataType[]) => {
    if (data.length !== 1) return sendError('Invalid number of ARGUMENTs for GET. Data: ' + data.join(' '));

    const key = data[0];
    if (typeof key !== 'string') return sendError('Invalid KEY for GET. Key: ' + key);

    const databaseValue = database.get(key);
    if (databaseValue === undefined) return socketWrite('$-1\r\n');

    if (databaseValue.expires !== -1 && databaseValue.expires < Date.now()) {
      database.delete(key);
      return socketWrite('$-1\r\n');
    }

    socketWrite(serializeData(databaseValue.value));
  };

  const runServerCommand: ServerHandler = (command: string, data: DataType[]) => {
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
