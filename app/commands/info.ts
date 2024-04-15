import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DataType, ServerAction } from '../types.ts';

const info: ServerAction = (data: DataType[]) => {
  return data[0] === 'replication'
    ? { value: RESPV2Serializer.serializeBulk('role:master') }
    : { error: 'Unknown INFO argument. Please provide a valid argument.' };
};

export default info;
