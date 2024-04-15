import { DataType } from './types.ts';

export function parseRespV2(buffer: string): DataType[] | DataType {
  // const data = buffer.toString().trim().split('\\r\\n').slice(0, -1); // For Development
  const data = buffer.toString().trim().split('\r\n');

  if (data[0] == undefined || data[0][0] == undefined)
    throw new Error(`Invalid data format. Parse request: ${data.join(' ')}`);

  const valueOrArrayParser = getValueOrParser(data[0][0]);

  if ('data' in valueOrArrayParser) {
    return [valueOrArrayParser.data];
  } else if ('isBulk' in valueOrArrayParser) {
    return [data[1]];
  } else if (typeof valueOrArrayParser === 'function') {
    return valueOrArrayParser(data);
  } else return;
}

function getValueOrParser(response: string): GetValueOrParser {
  switch (response[0]) {
    case '+': {
      return { data: parseString(response) };
    }
    case '-': {
      return { data: parseString(response) };
    }
    case ':': {
      return { data: parseInteger(response) };
    }
    case '$': {
      if (response.slice(1) === '0') return { data: '' };
      if (response.slice(1) === '-1') return { data: undefined };
      return { isBulk: true };
    }
    case '*': {
      if (response.slice(1) === '0') return () => [];
      if (response.slice(1) === '-1') return { data: undefined };
      return parseArray;
    }
    default: {
      throw new Error(`Invalid response type. Type request: ${response}`);
    }
  }
}

function parseString(data: string): string {
  if (data[0] !== '+' && data[0] !== '-') throw new Error(`Invalid string response. Parse request: ${data}`);
  if (data.length === 1) return '';

  return data.slice(1);
}

function parseInteger(data: string): number {
  if (data[0] !== ':' || Number.isNaN(Number.parseInt(data.slice(1))))
    throw new Error(`Invalid integer response. Parse request: ${data}`);
  const value = Number.parseInt(data.slice(1));
  if (Number.isInteger(value)) return value;
  throw new Error(`Invalid integer response. Value is not an integer. Parse request: ${data}`);
}

function parseArray(data: string[]): DataType[] | undefined {
  if (data[0] == undefined || data[0][0] == undefined)
    throw new Error(`Invalid array response. Operation field is empty. Parse request: [${data.join(' ')}]`);
  if (data[0][0] !== '*')
    throw new Error(`Invalid array response. Operation is for an array. Parse request: [${data.join(' ')}]`);
  let result: DataType[] = [];

  for (let index = 1; index < data.length; index++) {
    const operation = data[index];
    if (operation == undefined) continue;

    const valueOrArrayParser = getValueOrParser(operation);

    if ('data' in valueOrArrayParser) {
      result.push(valueOrArrayParser.data);
    } else if ('isBulk' in valueOrArrayParser) {
      result.push(data[index + 1]);
      index++;
    } else if (typeof valueOrArrayParser === 'function') {
      result = result.concat(valueOrArrayParser(data.slice(index + 1)));
      index++;
    }
  }
  return result;
}

type GetValueOrParser = { isBulk?: boolean; data?: DataType } | ((data: string[]) => DataType[] | undefined);
