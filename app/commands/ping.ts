import { DataType, ServerAction } from '../types.ts';

const ping: ServerAction = (data: DataType[]) => {
  let response = '+PONG\r\n';

  for (const object of data) {
    if (typeof object === 'string' && object.toLowerCase() === 'ping') response += '+PONG\r\n';
  }

  return { value: response };
};

export default ping;
