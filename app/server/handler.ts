/* eslint-disable unicorn/switch-case-braces */
import { echo, get, info, ping, set } from '../commands/index.ts';
import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import { DatabaseValue, ServerAction, ServerDatabaseAction } from './types.ts';

type CommandRunner = (command: string, data: RESPv2Data[]) => void;

interface ConstructorProperties {
  database: Map<string, DatabaseValue<RESPv2Data>>;
  socketWrite: (data: string) => void;
}

export default class ServerHandler {
  readonly socketWrite: (data: string) => void;
  readonly database: Map<string, DatabaseValue<RESPv2Data>>;
  readonly sendError: (message: string) => void;

  constructor({ database, socketWrite }: ConstructorProperties) {
    this.database = database;
    this.socketWrite = socketWrite;
    this.sendError = (message: string) => socketWrite(RESPv2.serializeError(message));
  }

  public run: CommandRunner = (command: string, data: RESPv2Data[]) => {
    switch (command.toLowerCase()) {
      case 'ping':
        return this.runCommand(data, ping);
      case 'echo':
        return this.runCommand(data, echo);
      case 'set':
        return this.runCommand(data, this.useDatabase(set));
      case 'get':
        return this.runCommand(data, this.useDatabase(get));
      case 'info':
        return this.runCommand(data, info);
      default:
        return this.sendError('Unknown command');
    }
  };

  private runCommand = (data: RESPv2Data[], fx: ServerAction<RESPv2Data>) => {
    const response = fx(data);
    if ('error' in response) return this.sendError(response.error);
    if ('value' in response) return this.socketWrite(response.value);
    throw new Error('Invalid ServerActionReturn type. Please provide a valid response type.');
  };

  private useDatabase(fx: ServerDatabaseAction<RESPv2Data>): ServerAction<RESPv2Data> {
    return (data: RESPv2Data[]) => fx({ data: data, database: this.database });
  }
}
