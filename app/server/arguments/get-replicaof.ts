import getServerArgument from '../helpers/get-server-argument.ts';

const getReplicaOf = () => {
  const parameters = getServerArgument('--replicaof', 2);
  if (parameters && parameters[0] && parameters[1]) return { host: parameters[0], port: Number(parameters[1]) };
  return;
};

export default getReplicaOf;
