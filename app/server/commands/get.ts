import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';
import { DatabaseAction, DatabaseActionProperties } from '../types.ts';

const get: DatabaseAction<RESPv2Data> = ({ data, database }: DatabaseActionProperties<RESPv2Data>) => {
  if (data.length !== 1) return { error: `Invalid number of ARGUMENTs for GET. Data: ${data.join(' ')}` };

  const key = data[0];
  if (typeof key !== 'string') return { error: `Invalid KEY for GET. Data: ${data.join(' ')}` };

  const databaseValue = database.get(key);
  if (databaseValue === undefined) return { value: '$-1\r\n' };

  if (databaseValue.expires !== -1 && databaseValue.expires < Date.now()) {
    database.delete(key);
    return { value: '$-1\r\n' };
  }

  return { value: RESPv2.serializeData(databaseValue.value) };
};

export default get;
