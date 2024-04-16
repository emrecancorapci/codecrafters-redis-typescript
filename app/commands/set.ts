import { ServerDatabaseAction, ServerDatabaseActionProperties } from '../types.ts';

const set: ServerDatabaseAction = ({ data, database }: ServerDatabaseActionProperties) => {
  if (data.length < 2) return { error: `Not enough number of ARGUMENTs for SET. Data: ${data.join(' ')}` };
  const [key, value, ...setArguments] = data;

  if (typeof key !== 'string') return { error: `Invalid KEY for SET. Key: ${key}` };
  if (typeof value !== 'string' && typeof value !== 'number')
    return { error: `Invalid VALUE for SET. Value: ${value}` };

  switch (data.length) {
    case 2: {
      database.set(key, { value, expires: -1 });
      return { value: '+OK\r\n' };
    }
    case 4: {
      const [argument, argumentValue] = setArguments;

      if (typeof argument !== 'string' || argument.toLowerCase() !== 'px')
        return { error: `Invalid ARGUMENT for SET. Argument: ${argument}` };

      const expireDate = Number(argumentValue);
      if (Number.isNaN(expireDate) || expireDate < 0)
        return { error: `Invalid EXPIRE for SET. Expire: ${argumentValue}` };

      database.set(key, { value, expires: Date.now() + expireDate });
      return { value: '+OK\r\n' };
    }
    default: {
      return { error: `Invalid number of ARGUMENTs for SET. Data: ${data.join(' ')}` };
    }
  }
};

export default set;
