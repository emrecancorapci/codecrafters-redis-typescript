export function respV2Parser(buffer: string): DataType[] | DataType {
  const data = buffer.toString().trim().split('\r\n').slice(0, -1);
  console.log('Parsed data:', data);
  const valueOrArrayParser = getValueOrParser(data[0][0]);

  if ("data" in valueOrArrayParser) {
    return [valueOrArrayParser.data];
  } else if ("isBulk" in valueOrArrayParser) {
    return [data[1]];
  } else if (typeof valueOrArrayParser === 'function') {
    return valueOrArrayParser(data);
  } else return;
}

export function respV2Unparser(data: DataType[] | DataType): string {
  if (typeof data === 'number') {
    return `:${data}\r\n`;
  } else if (typeof data === 'string') {
    return `+${data}\r\n`;
  } else if (data === undefined) {
    return '$-1\r\n';
  } else if (Array.isArray(data)) {
    return `*${data.length}\r\n${data.map(respV2Unparser).join('')}`;
  }
  throw new Error('Invalid data.');
}

export function respV2ErrorUnparser(data: string): string {
  return `-${data}\r\n`;
}

type GetValueOrParser = { isBulk?: boolean, data?: DataType } | ((data: string[]) => DataType[] | undefined)

function getValueOrParser(response: string): GetValueOrParser {
  switch (response[0]) {
    case '+':
      return { data: parseString(response) };
    case '-':
      return { data: parseString(response) };
    case ':':
      return { data: parseInteger(response) };
    case '$':
      if (response.slice(1) === '0') return { data: '' };
      if (response.slice(1) === '-1') return { data: undefined };
      return { isBulk: true }
    case '*':
      if (response.slice(1) === '0') return () => [];
      if (response.slice(1) === '-1') return { data: undefined };
      return parseArray;
    default:
      throw new Error(`Invalid response type. Type request: ${response}`);
  }
}

function parseString(data: string): string {
  if (data[0] !== '+' && data[0] !== '-') throw new Error(`Invalid string response. Parse request: ${data}`);
  if (data.length === 1) return '';

  return data.slice(1);
}

function parseInteger(data: string): number {
  if (data[0] !== ':' || isNaN(parseInt(data.slice(1)))) throw new Error(`Invalid integer response. Parse request: ${data}`);
  const value = parseInt(data.slice(1));
  if (Number.isInteger(value)) return value;
  throw new Error('Invalid integer response');
}

function parseArray(data: string[]): DataType[] | undefined {
  if (data[0][0] !== '*') throw new Error(`Invalid array response. Parse request: ${data}`);
  let result: (DataType)[] = [];

  for (let i = 1; i < data.length; i++) {
    const valueOrArrayParser = getValueOrParser(data[i]);

    if ("data" in valueOrArrayParser) {
      result.push(valueOrArrayParser.data);
    } else if ("isBulk" in valueOrArrayParser) {
      result.push(data[i + 1]);
      i++;
    } else if (typeof valueOrArrayParser === 'function') {
      result = result.concat(valueOrArrayParser(data.slice(i + 1)));
      i++;
    }
  }
  return result;
}

type DataType = number | string | undefined;
