import { Container } from "inversify";
import * as Auth from "./auth";
import * as Utils from "./utils";

const container = new Container();
container.bind(Utils.Dynamo.WRAPPER_KEY).to(Utils.Dynamo.DynamoTableWrapper);

export default container;
export const isLoaded = Auth.Container.load(container);
