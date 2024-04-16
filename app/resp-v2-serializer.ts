import { DataType } from './types.ts';

export default class RESPV2Serializer {
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
   * @example 'PING' => *1\r\n$4\r\nPING\r\n
   * @returns String with the array preceded by an asterisk and followed by a CRLF
   */
  public static serializeMultiBulk = (data: string[]) => this.serializeBulk(data.join('\r\n'));

  /**
   * @param data - Array to be serialized
   * @example ['PING', 'PING'] => *2\r\n$4\r\nPING\r\n$4\r\nPING\r\n
   * @returns String with the array preceded by an asterisk and followed by a CRLF
   */
  public static serializeArray: (data: DataType[]) => string = (data: DataType[]) => {
    if (data.length === 0) return '*0\r\n';
    if (data.length === 1) return RESPV2Serializer.serializeData(data[0]);
    return `*${data.length}\r\n${data.map((value) => RESPV2Serializer.serializeData(value)).join('')}`;
  };

  /**
   * @param data - Data to be serialized
   * @returns String with the data preceded by the respective symbol and followed by a CRLF
   */
  public static serializeData = (data: DataType | DataType[]) => {
    if (typeof data === 'number') {
      return RESPV2Serializer.serializeNumber(data);
    } else if (typeof data === 'string') {
      return RESPV2Serializer.serializeBulk(data);
    } else if (data == undefined) {
      return '$-1\r\n';
    } else if (Array.isArray(data)) {
      return RESPV2Serializer.serializeArray(data);
    }
    throw new Error(`Invalid data type to serialize.`);
  };
}
