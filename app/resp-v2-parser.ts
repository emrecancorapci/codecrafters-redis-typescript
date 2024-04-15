import { DataType } from './types.ts';

export default class RESPV2Parser {
  public static parse(buffer: string): DataType[] | DataType {
    // const data = buffer.toString().trim().split('\\r\\n').slice(0, -1); // For Development
    const data = buffer.toString().trim().split('\r\n');

    if (data[0] == undefined || data[0][0] == undefined)
      throw new Error(`Invalid data format. Parse request: ${data.join(' ')}`);

    switch (data[0][0]) {
      case '+':
      case '-': {
        return RESPV2Parser.parseString(data[0]);
      }
      case ':': {
        return RESPV2Parser.parseInteger(data[0]);
      }
      case '$': {
        if (data[0].slice(1) === '0') return '';
        else if (data[0].slice(1) === '-1') return undefined;
        else return data[1];
      }
      case '*': {
        if (data[0].slice(1) === '0') return [];
        else if (data[0].slice(1) === '-1') return undefined;
        else return RESPV2Parser.parseArray(data.slice(1));
      }
    }
  }

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

  private static parseArray(data: string[]): DataType[] | undefined {
    if (data[0] == undefined || data[0][0] == undefined)
      throw new Error(`Invalid array response. Operation field is empty. Parse request: [${data.join(' ')}]`);
    if (data[0][0] !== '*')
      throw new Error(`Invalid array response. Operation is for an array. Parse request: [${data.join(' ')}]`);
    let result: DataType[] = [];

    for (let index = 1; index < data.length; index++) {
      const operation = data[index];
      if (operation == undefined) continue;

      switch (operation[0]) {
        case '+':
        case '-': {
          result.push(RESPV2Parser.parseString(operation));
          continue;
        }
        case ':': {
          result.push(RESPV2Parser.parseInteger(operation));
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
          else result = result.concat(RESPV2Parser.parseArray(data.slice(index + 1)));
          index++;
          continue;
        }
      }
    }
    return result;
  }
}
