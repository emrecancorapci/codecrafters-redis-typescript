/* eslint-disable unicorn/switch-case-braces */
import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import getReplicaOf from './arguments/get-replicaof.ts';
import { echo, get, info, ping, pong, set } from './commands/index.ts';
import { DatabaseAction, DatabaseValue, RoleAction, ServerAction, ServerActionProperties } from './types.ts';

type CommandRunner = (command: string, data: RESPv2Data[]) => void;

export default class ServerHandler {
  readonly sendError: (message: string) => void;

  commands: Map<string, ServerAction<RESPv2Data>> = new Map([
    ['ping', ping],
    ['echo', echo],
    ['set', this.useDatabase(set)],
    ['get', this.useDatabase(get)],
    ['info', this.useRole(info)],
    ['pong', this.useRole(pong)],
  ]);

  constructor(
    readonly database: Map<string, DatabaseValue<RESPv2Data>>,
    readonly socketWrite: (data: string) => void
  ) {
    this.sendError = (message: string) => socketWrite(RESPv2.serializeError(message));
  }

  public run: CommandRunner = (command: string, data: RESPv2Data[]) => {
    return this.commands.has(command.toLowerCase())
      ? this.commandRunner(data, this.commands.get(command.toLowerCase()) as ServerAction<RESPv2Data>)
      : this.sendError('Unknown command');
  };

  private commandRunner = (data: RESPv2Data[], fx: ServerAction<RESPv2Data>) => {
    const response = fx({ data });
    if ('error' in response) return this.sendError(response.error);
    if ('value' in response) return this.socketWrite(response.value);
    throw new Error('Invalid ServerActionReturn type. Please provide a valid response type.');
  };

  private useDatabase(fx: DatabaseAction<RESPv2Data>): ServerAction<RESPv2Data> {
    return ({ data }: ServerActionProperties<RESPv2Data>) => fx({ data, database: this.database });
  }

  private useRole(fx: RoleAction<RESPv2Data>): ServerAction<RESPv2Data> {
    return ({ data }: ServerActionProperties<RESPv2Data>) => {
      const master = getReplicaOf();
      if (!master) return { error: 'Operation not permitted' };
      return fx({ data, master });
    };
  }
}
