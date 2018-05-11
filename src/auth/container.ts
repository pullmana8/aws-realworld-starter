import { DynamoDB } from 'aws-sdk/clients/all';
import { ContainerModule } from "inversify";
import * as Utils from './../utils';
import * as Models from "./models";
import * as Repos from "./repos";
import * as Services from "./services";
import * as Settings from "./settings";

export const module = new ContainerModule(bind => {
  bind(Models.MODULE_TYPES.Database).toProvider<Utils.Dynamo.IDynamoTable>(context => {
    return () => {
      return Promise.resolve().then(() => {
        const table = context.container.get<Utils.Dynamo.IDynamoTable>(Utils.Dynamo.WRAPPER_KEY);
        table.documentClient = new DynamoDB.DocumentClient();
        const envIdFields = Utils.getEnvVar(Settings.EnvVars.AuthTableIdFields);
        table.settings = {
          addTimestamps: Utils.getEnvVar(Settings.EnvVars.AuthTableAddTimestamps, Settings.DEFAULTS).toUpperCase() === "TRUE",
          table: {
            name: Utils.getEnvVar(Settings.EnvVars.AuthTableName, Settings.DEFAULTS),
            idFields: (envIdFields ? envIdFields : Settings.DEFAULTS.table.idFields).split(",")
          }
        };
        return table;
      });
    };
  });
  bind(Models.MODULE_TYPES.Repo).to(Repos.Repo);
  bind(Models.MODULE_TYPES.Service).to(Services.Service);
});
