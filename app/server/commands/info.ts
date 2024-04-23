import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';
import { RoleAction, RoleActionProperties } from '../types.ts';

const info: RoleAction<RESPv2Data> = ({ data, master }: RoleActionProperties<RESPv2Data>) => {
  if (data.length === 0) return { error: 'INFO command requires at least one argument.' };
  if (data[0] === undefined) return { error: 'INFO command requires at least one argument.' };

  if (data[0].toString().toLowerCase() === 'replication') {
    return master
      ? { value: RESPv2.serializeBulk('role:slave') }
      : {
          value: RESPv2.serializeMultiBulk([
            'role:master',
            'master_replid:' + crypto.randomUUID(),
            'master_repl_offset:' + '0',
          ]),
        };
  }

  return { error: 'Unknown INFO argument. Please provide a valid argument.' };
};

export default info;
