import RESPV2Serializer from '../resp-v2-serializer.ts';
import { DataType, ServerAction } from '../types.ts';

const echo: ServerAction = (data: DataType[]) => {
  const response = RESPV2Serializer.serializeData(data.length === 1 ? data[0] : data);
  return { value: response };
};

export default echo;
