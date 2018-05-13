import { DynamoDB } from 'aws-sdk/clients/all';
import { ContainerModule, Container } from "inversify";
import * as Utils from './../utils';
import * as Models from "./models";
import * as Repos from "./repos";
import * as Services from "./services";
import * as Settings from "./settings";

type DatabaseProvider = () => Promise<Utils.Dynamo.IDynamoTable>;
const DATABASE_PROVIDER_KEY = Symbol("AuthDbProvider");

const containerModule = new ContainerModule(bind => {
  bind(DATABASE_PROVIDER_KEY).toProvider<Utils.Dynamo.IDynamoTable>(context => {
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

export function load(container: Container): Promise<void> {
  container.load(containerModule);
  const provider: DatabaseProvider = container.get(DATABASE_PROVIDER_KEY);
  return provider().then(table => {
    container.bind(Models.MODULE_TYPES.Database).toConstantValue(table);
  });
}
