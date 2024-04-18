export type DatabaseValue<T> = { value: T; expires: number };

export type ServerAction<T> = (data: T[]) => ServerActionReturn;
export type ServerDatabaseAction<T> = ({ data, database }: ServerDatabaseActionProperties<T>) => ServerActionReturn;

export interface ServerDatabaseActionProperties<T> {
  data: T[];
  database: Map<string, DatabaseValue<T>>;
}

export type ServerActionReturn = { value: string } | { error: string };
