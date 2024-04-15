import { argv } from 'node:process';

const getPort = () => {
  if (argv.length > 3) {
    const runArguments = argv.slice(2);
    const portArgumentIndex = runArguments.findIndex((value) => value.toLowerCase() == '--port');
    return portArgumentIndex >= 0 ? Number(runArguments[portArgumentIndex + 1]) : 6379;
  } else {
    return 6379;
  }
};

export default getPort;
