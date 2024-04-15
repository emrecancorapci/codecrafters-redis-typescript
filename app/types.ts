export type DataType = number | string | undefined;
export type DatabaseValue = { value: DataType; expires: number };

export type ServerActionReturn = { value: string } | { error: string };
export type ServerAction = (data: DataType[]) => ServerActionReturn;
export type ServerDatabaseAction = ({ data, database }: ServerDatabaseActionProperties) => ServerActionReturn;

export interface ServerDatabaseActionProperties {
  data: DataType[];
  database: Map<string, DatabaseValue>;
}
