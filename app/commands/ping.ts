import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DataType, ServerAction } from '../types.ts';

const ping: ServerAction = (data: DataType[]) => {
  const isPing = (item: DataType) => typeof item === 'string' && item.toLowerCase() === 'ping';
  const serialPong = RESPV2Serializer.serializeString('PONG');

  const pingResponses = data.filter((item) => isPing(item)).map(() => serialPong);

  return { value: serialPong + pingResponses.join('') };
};

export default ping;
