export type RESPv2Data = number | string | undefined;

export default class RESPv2 {
  public static parse(buffer: string): RESPv2Data[] | RESPv2Data {
    const data =
      process.env.ENV_MODE === 'dev'
        ? buffer.toString().trim().split('\\r\\n').slice(0, -1)
        : buffer.toString().trim().split('\r\n');

    if (data[0] == undefined || data[0][0] == undefined)
      throw new Error(`Invalid data format. Parse request: ${data.join(' ')}`);

    switch (data[0][0]) {
      case '+':
      case '-': {
        return RESPv2.parseString(data[0]);
      }
      case ':': {
        return RESPv2.parseInteger(data[0]);
      }
      case '$': {
        if (data[0].slice(1) === '0') return '';
        else if (data[0].slice(1) === '-1') return undefined;
        else return data[1];
      }
      case '*': {
        if (data[0].slice(1) === '0') return [];
        else if (data[0].slice(1) === '-1') return undefined;
        else return RESPv2.parseArray(data);
      }
    }
  }

  /**
   * @param data - Number to be serialized
   * @example 256 => :256\r\n
   * @returns String with the number preceded by a colon and followed by a CRLF
   */
  public static serializeNumber = (data: number) => `:${data}\r\n`;

  /**
   * @param data - String to be serialized
   * @example 'PING' => +PING\r\n
   * @returns String with the string preceded by a plus sign and followed by a CRLF
   */
  public static serializeString = (data: string) => `+${data}\r\n`;

  /**
   * @param data - String to be serialized as an error
   * @example 'ERR' => -ERR\r\n
   * @returns String with the string preceded by a minus sign and followed by a CRLF
   */
  public static serializeError = (data: string) => `-${data}\r\n`;

  /**
   * @param data - String to be serialized as a bulk
   * @example 'PING' => $4\r\nPING\r\n
   * @returns String with the string preceded by a dollar sign and followed by a CRLF
   */
  public static serializeBulk = (data: string) => `$${data.length}\r\n${data}\r\n`;

  /**
   * @param data - Array to be serialized
   * @example ['PING', 'PING'] => $4\r\nPING\r\n$4\r\nPING\r\n
   * @returns String with the array preceded by an asterisk and followed by a CRLF
   */
  public static serializeMultiBulk = (data: string[]) => this.serializeBulk(data.join('\r\n'));

  /**
   * @param data - Array to be serialized
   * @example ['PING', 'PING'] => *2\r\n$4\r\nPING\r\n$4\r\nPING\r\n
   * @returns String with the array preceded by an asterisk and followed by a CRLF
   */
  public static serializeArray: (data: RESPv2Data[]) => string = (data: RESPv2Data[]) => {
    if (data.length === 0) return '*0\r\n';
    if (data.length === 1) return '*1\r\n' + RESPv2.serializeData(data[0]);
    return `*${data.length}\r\n${data.map((value) => RESPv2.serializeData(value)).join('')}`;
  };

  /**
   * @param data - Data to be serialized
   * @returns String with the data preceded by the respective symbol and followed by a CRLF
   */
  public static serializeData = (data: RESPv2Data | RESPv2Data[]) => {
    if (typeof data === 'number') {
      return RESPv2.serializeNumber(data);
    } else if (typeof data === 'string') {
      return RESPv2.serializeBulk(data);
    } else if (data == undefined) {
      return '$-1\r\n';
    } else if (Array.isArray(data)) {
      return RESPv2.serializeArray(data);
    }
    throw new Error(`Invalid data type to serialize.`);
  };

  private static parseString(data: string): string {
    if (data[0] !== '+' && data[0] !== '-') throw new Error(`Invalid string response. Parse request: ${data}`);
    if (data.length === 1) return '';

    return data.slice(1);
  }

  private static parseInteger(data: string): number {
    if (data[0] !== ':' || Number.isNaN(Number.parseInt(data.slice(1))))
      throw new Error(`Invalid integer response. Parse request: ${data}`);
    const value = Number.parseInt(data.slice(1));
    if (Number.isInteger(value)) return value;
    throw new Error(`Invalid integer response. Value is not an integer. Parse request: ${data}`);
  }

  private static parseArray(data: string[]): RESPv2Data[] | undefined {
    if (data[0] == undefined || data[0][0] == undefined)
      throw new Error(`Invalid array response. Operation field is empty. Parse request: [${data.join(', ')}]`);
    if (data[0][0] !== '*')
      throw new Error(`Invalid array response. Wrong operation. Parse request: [${data.join(', ')}]`);
    let result: RESPv2Data[] = [];

    for (let index = 1; index < data.length; index++) {
      const operation = data[index];
      if (operation == undefined) continue;

      switch (operation[0]) {
        case '+':
        case '-': {
          result.push(RESPv2.parseString(operation));
          continue;
        }
        case ':': {
          result.push(RESPv2.parseInteger(operation));
          continue;
        }
        case '$': {
          if (operation.slice(1) === '0') result.push('');
          else if (operation.slice(1) === '-1') result.push(undefined);
          else result.push(data[index + 1]);
          index++;
          continue;
        }
        case '*': {
          if (operation.slice(1) === '0') continue;
          else if (operation.slice(1) === '-1') result.push(undefined);
          else result = result.concat(RESPv2.parseArray(data.slice(index + 1)));
          index++;
          continue;
        }
      }
    }
    return result;
  }
}
