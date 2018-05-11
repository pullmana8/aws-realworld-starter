import * as Util from "../utils";

export enum EnvVars {
  AuthTableName = "AUTH_TABLE_NAME",
  /**
   * Comma Separated list of id fields
   */
  AuthTableIdFields = "AUTH_TABLE_ID_FIELDS",
  AuthTableAddTimestamps = "AUTH_TABLE_ADD_TIMESTAMPS"
}

export interface ISettings extends Util.Dynamo.IDynamoSettings { }

export const DEFAULTS = {
  addTimestamps: true,
  table: {
    name: "Auth",
    // Expected to be a comma separated list
    idFields: "email"
  }
};
