import { DataType } from "./types.ts";

/** 
 * @param data - Number to be serialized
 * @returns String with the number preceded by a colon and followed by a CRLF
 */
export const serializeNumber = (data: number) => `:${data}\r\n`;

/** 
 * @param data - String to be serialized
 * @returns String with the string preceded by a plus sign and followed by a CRLF
 */
export const serializeString = (data: string) => `+${data}\r\n`;

/** 
 * @param data - String to be serialized as an error
 * @returns String with the string preceded by a minus sign and followed by a CRLF
 */
export const serializeError = (data: string) => `-${data}\r\n`;

/** 
 * @param data - String to be serialized as a bulk
 * @returns String with the string preceded by a dollar sign and followed by a CRLF
 */
export const serializeBulk = (data: string) => `$${data.length}\r\n${data}\r\n`;

/** 
 * @param data - Array to be serialized
 * @returns String with the array preceded by an asterisk and followed by a CRLF
 */
export const serializeArray = (data: DataType[]) => {
    if(data.length === 0) return '*0\r\n';
    if(data.length === 1) return serializeData(data[0]);
    `*${data.length}\r\n${data.map(serializeData).join('')}`;
}

/** 
 * @param data - Data to be serialized
 * @returns String with the data preceded by the respective symbol and followed by a CRLF
 */
export const serializeData = (data: DataType | DataType[]) => {
  if (typeof data === 'number') {
    return serializeNumber(data);
  } else if (typeof data === 'string') {
    return serializeBulk(data);
  } else if (data == undefined) {
    return '$-1\r\n';
  } else if (Array.isArray(data)) {
    return serializeArray(data);
  }
  throw new Error('Invalid data.');
}