import RESPv2, { RESPv2Data } from '../../protocols/resp-v2.ts';

type ParsedBuffer = { operation: string; data: RESPv2Data[] } | { error: string };

export function parseBuffer(buffer: Buffer): ParsedBuffer {
  const parsedBuffer = RESPv2.parse(buffer.toString());

  if (parsedBuffer === undefined) return { error: 'Parser returns nothing. Please provide a valid RESPv2 data.' };
  if (!Array.isArray(parsedBuffer)) return { error: 'Invalid data. Please provide a valid RESPv2 array.' };
  if (typeof parsedBuffer[0] !== 'string') return { error: 'Command should be a string.' };

  return { operation: parsedBuffer[0], data: parsedBuffer.slice(1) };
}
