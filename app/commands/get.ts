import RESPV2Serializer from '../resp-v2-serializer.ts';
import { ServerDatabaseAction, ServerDatabaseActionProperties } from '../types.ts';

const get: ServerDatabaseAction = ({ data, database }: ServerDatabaseActionProperties) => {
  if (data.length !== 1) return { error: `Invalid number of ARGUMENTs for GET. Data: ${data.join(' ')}` };

  const key = data[0];
  if (typeof key !== 'string') return { error: `Invalid KEY for GET. Data: ${data.join(' ')}` };

  const databaseValue = database.get(key);
  if (databaseValue === undefined) return { value: '$-1\r\n' };

  if (databaseValue.expires !== -1 && databaseValue.expires < Date.now()) {
    database.delete(key);
    return { value: '$-1\r\n' };
  }

  return { value: RESPV2Serializer.serializeData(databaseValue.value) };
};

export default get;
