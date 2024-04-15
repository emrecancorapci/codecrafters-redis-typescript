import { serializeData, serializeError } from './resp-v2-serializer.ts';
import { DatabaseValue, DataType } from './types.ts';

type ServerAction = (data: DataType[]) => void;
type ServerRun = (command: string, data: DataType[]) => void;

interface ConstructorProperties {
  database: Map<string, DatabaseValue>;
  socketWrite: (data: string) => void;
}

export default class ServerHandler {
  readonly socketWrite: (data: string) => void;
  readonly database: Map<string, DatabaseValue>;
  readonly sendError: (message: string) => void;

  constructor({ database, socketWrite }: ConstructorProperties) {
    this.database = database;
    this.socketWrite = socketWrite;
    this.sendError = (message: string) => socketWrite(serializeError(message));
  }

  private ping: ServerAction = (data: DataType[]) => {
    this.socketWrite('+PONG\r\n');
    for (const object of data) {
      if (typeof object === 'string' && object.toLowerCase() === 'ping') this.socketWrite('+PONG\r\n');
    }
  };

  private echo: ServerAction = (data: DataType[]) => {
    const response = serializeData(data.length === 1 ? data[0] : data);
    this.socketWrite(response);
  };

  private set: ServerAction = (data: DataType[]) => {
    if (data.length < 2) return this.sendError('Not enough number of ARGUMENTs for SET. Data: ' + data.join(' '));
    const [key, value, ...setArguments] = data;

    if (typeof key !== 'string') return this.sendError('Invalid KEY for SET. Key: ' + key);
    if (typeof value !== 'string' && typeof value !== 'number')
      return this.sendError('Invalid VALUE for SET. Value: ' + value);

    if (data.length === 2) {
      this.database.set(key, { value, expires: -1 });
      return this.socketWrite('+OK\r\n');
    }

    if (data.length === 4) {
      const [argument, argumentValue] = setArguments;

      if (typeof argument !== 'string') return this.sendError('Invalid ARGUMENT type for SET. Argument: ' + argument);
      if (argument.toLowerCase() === 'px') {
        const expires = Number(argumentValue);
        if (Number.isNaN(expires) || expires < 0)
          return this.sendError('Invalid EXPIRES for SET. Expires: ' + argumentValue);

        this.database.set(key, { value, expires: Date.now() + expires });
        return this.socketWrite('+OK\r\n');
      } else {
        return this.sendError('Invalid ARGUMENT pair for SET. Argument: ' + argument + ' Value: ' + argumentValue);
      }
    }

    return this.sendError('Invalid number of ARGUMENTs for SET. Data: ' + data.join(' '));
  };

  private get: ServerAction = (data: DataType[]) => {
    if (data.length !== 1) return this.sendError('Invalid number of ARGUMENTs for GET. Data: ' + data.join(' '));

    const key = data[0];
    if (typeof key !== 'string') return this.sendError('Invalid KEY for GET. Key: ' + key);

    const databaseValue = this.database.get(key);
    if (databaseValue === undefined) return this.socketWrite('$-1\r\n');

    if (databaseValue.expires !== -1 && databaseValue.expires < Date.now()) {
      this.database.delete(key);
      return this.socketWrite('$-1\r\n');
    }

    this.socketWrite(serializeData(databaseValue.value));
  };

  run: ServerRun = (command: string, data: DataType[]) => {
    switch (command.toLowerCase()) {
      case 'ping': {
        this.ping(data);
        break;
      }
      case 'echo': {
        this.echo(data);
        break;
      }
      case 'set': {
        this.set(data);
        break;
      }
      case 'get': {
        this.get(data);
        break;
      }
      default: {
        this.sendError('Unknown command');
      }
    }
  };
}
