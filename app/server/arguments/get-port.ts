import getServerArgument from '../helpers/get-server-argument.ts';

const getPort = () => {
  const parameters = getServerArgument('--port', 1);
  if (parameters) return Number(parameters[0]);
  return 6379;
};

export default getPort;
