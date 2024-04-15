import { argv } from 'node:process';

const getServerArgument = (flag: string, parameterNumber: number) => {
  if (argv.length > parameterNumber + 2) {
    const runArguments = argv.slice(2);
    const argumentIndex = runArguments.findIndex((value) => value.toLowerCase() == flag);
    return argumentIndex > -1 ? runArguments.slice(argumentIndex + 1, argumentIndex + 1 + parameterNumber) : undefined;
  }
};

export default getServerArgument;
