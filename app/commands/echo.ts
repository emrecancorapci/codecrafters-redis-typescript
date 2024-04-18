import RESPv2, { RESPv2Data } from '../protocols/resp-v2.ts';
import { ServerAction } from '../server/types.ts';

const echo: ServerAction<RESPv2Data> = (data: RESPv2Data[]) => {
  const response = RESPv2.serializeData(data.length === 1 ? data[0] : data);
  return { value: response };
};

export default echo;
