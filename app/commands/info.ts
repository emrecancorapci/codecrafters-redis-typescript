import RESPV2Serializer from '../resp-v2-serializer.ts';
import getReplicaOf from '../server/arguments/get-replicaof.ts';
import { DataType, ServerAction } from '../types.ts';

const info: ServerAction = (data: DataType[]) => {
  const masterInfo = getReplicaOf();

  if (data[0] === 'replication') {
    return masterInfo
      ? {
          value: RESPV2Serializer.serializeMultiBulk([
            'role:slave',
            'master_replid:' + crypto.randomUUID(),
            'master_repl_offset:' + '0',
          ]),
        }
      : { value: RESPV2Serializer.serializeBulk('role:master') };
  }

  return { error: 'Unknown INFO argument. Please provide a valid argument.' };
};

export default info;
