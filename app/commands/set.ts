import { ServerDatabaseAction, ServerDatabaseActionProperties } from '../types.ts';

const set: ServerDatabaseAction = ({ data, database }: ServerDatabaseActionProperties) => {
  if (data.length < 2) return { error: `Not enough number of ARGUMENTs for SET. Data: ${data.join(' ')}` };
  const [key, value, ...setArguments] = data;

  if (typeof key !== 'string') return { error: `Invalid KEY for SET. Key: ${key}` };
  if (typeof value !== 'string' && typeof value !== 'number')
    return { error: `Invalid VALUE for SET. Value: ${value}` };

  if (data.length === 2) {
    database.set(key, { value, expires: -1 });
    return { value: '+OK\r\n' };
  }

  if (data.length !== 4) return { error: `Invalid number of ARGUMENTs for SET. Data: ${data.join(' ')}` };

  const [argument, argumentValue] = setArguments;

  if (typeof argument !== 'string' || argument.toLowerCase() !== 'px')
    return { error: `Invalid ARGUMENT for SET. Argument: ${argument}` };

  const expires = Number(argumentValue);
  if (Number.isNaN(expires) || expires < 0) return { error: `Invalid EXPIRES for SET. Expires: ${argumentValue}` };

  database.set(key, { value, expires: Date.now() + expires });
  return { value: '+OK\r\n' };
};

export default set;
