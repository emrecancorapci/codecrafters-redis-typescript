import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';
import { ServerAction, ServerActionProperties } from '../types.ts';

const ping: ServerAction<RESPv2Data> = ({ data }: ServerActionProperties<RESPv2Data>) => {
  const isPing = (item: RESPv2Data) => typeof item === 'string' && item.toLowerCase() === 'ping';
  const serialPong = RESPv2.serializeString('PONG');

  const pingResponses = data.filter((item) => isPing(item)).map(() => serialPong);

  return { value: serialPong + pingResponses.join('') };
};

export default ping;
