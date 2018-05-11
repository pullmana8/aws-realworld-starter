import "reflect-metadata";
import { Container } from "inversify";
import * as Auth from "./auth";
import * as Utils from "./utils";

const container = new Container();
container.bind(Utils.Dynamo.WRAPPER_KEY).to(Utils.Dynamo.DynamoTableWrapper);
container.load(Auth.Container.module);

export default container;
