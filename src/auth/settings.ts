import * as Util from "../utils";
import { injectable } from "inversify";

export enum EnvVars {
  /**
   * Number value representing milliseconds for the duration of the auth JWT token
   */
  jwtExpiration = "AUTH_TABLE_JWT_EXPIRATION",
  jwtSecret = "AUTH_TABLE_JWT_SECRET",
  tableName = "AUTH_TABLE_NAME",
  /**
   * Comma Separated list of id fields
   */
  tableIdFields = "AUTH_TABLE_ID_FIELDS",
  tableAddTimestamps = "AUTH_TABLE_ADD_TIMESTAMPS"
}

export const DEFAULTS = {
  addTimestamps: true,
  table: {
    name: "Auth",
    // Expected to be a comma separated list
    idFields: "email"
  },
  // 30 minutes in seconds
  tokenExpiration: 1800,
  tokenSecret: "to-be-replaced-by-env-var"
};

export interface ISettings extends Util.Dynamo.IDynamoSettings {
  tokenExpiration: number;
  tokenSecret: string;
}

@injectable()
export class Settings implements ISettings {
  addTimestamps: boolean = Util.getEnvVar(EnvVars.tableAddTimestamps, DEFAULTS).toUpperCase() === "TRUE";
  tokenSecret: string = Util.getEnvVar(EnvVars.jwtSecret, DEFAULTS);
  tokenExpiration: number = parseInt(Util.getEnvVar(EnvVars.jwtExpiration, DEFAULTS), 10);
  table: {
    name: string;
    idFields: string[];
  };

  constructor() {
    const envIdFields = Util.getEnvVar(EnvVars.tableIdFields);
    this.table = {
      name: Util.getEnvVar(EnvVars.tableName, DEFAULTS),
      idFields: (envIdFields ? envIdFields : DEFAULTS.table.idFields).split(",")
    };
  }
}
