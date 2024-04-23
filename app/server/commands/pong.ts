import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';
import { RoleAction, RoleActionProperties } from '../types.ts';

const pong: RoleAction<RESPv2Data> = ({ master }: RoleActionProperties<RESPv2Data>) => {
  if (master === undefined) return { error: 'No master found.' };
  return {
    value: RESPv2.serializeArray([
      'REPLICAOF',
      'listening-port',
      master.port.toString(),
      'REPLICAOF',
      'capa',
      'psync2',
    ]),
  };
};

export default pong;
