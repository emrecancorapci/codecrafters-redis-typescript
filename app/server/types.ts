export type DatabaseValue<T> = { value: T; expires: number };

export type ServerAction<T> = ({ data }: ServerActionProperties<T>) => ServerActionReturn;
export type DatabaseAction<T> = ({ data, database }: DatabaseActionProperties<T>) => ServerActionReturn;
export type RoleAction<T> = ({ data, master }: RoleActionProperties<T>) => ServerActionReturn;

export interface ServerActionProperties<T> {
  data: T[];
}
export interface DatabaseActionProperties<T> extends ServerActionProperties<T> {
  database: Map<string, DatabaseValue<T>>;
}
export interface RoleActionProperties<T> extends ServerActionProperties<T> {
  master: { host: string; port: number };
}

export type ServerActionReturn = { value: string } | { error: string };
