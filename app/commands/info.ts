import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import getReplicaOf from '../server/arguments/get-replicaof.ts';
import { ServerAction } from '../server/types.ts';

const info: ServerAction<RESPv2Data> = (data: RESPv2Data[]) => {
  const masterInfo = getReplicaOf();

  if (data[0] === 'replication') {
    return masterInfo
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
