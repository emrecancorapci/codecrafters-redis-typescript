import RESPV2Serializer from '../resp-v2-serializer.ts';
import getReplicaOf from '../server/arguments/get-replicaof.ts';
import { DataType, ServerAction } from '../types.ts';

const info: ServerAction = (data: DataType[]) => {
  const masterInfo = getReplicaOf();

  if (data[0] === 'replication') {
    return masterInfo
      ? { value: RESPV2Serializer.serializeBulk('role:slave') }
      : {
          value: RESPV2Serializer.serializeMultiBulk([
            'role:master',
            'master_replid:' + crypto.randomUUID(),
            'master_repl_offset:' + '0',
          ]),
        };
  }

  return { error: 'Unknown INFO argument. Please provide a valid argument.' };
};

export default info;
