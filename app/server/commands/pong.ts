import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';
import { SlaveAction, SlaveActionProperties } from '../types.ts';

const pong: SlaveAction<RESPv2Data> = ({ master }: SlaveActionProperties<RESPv2Data>) => {
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
