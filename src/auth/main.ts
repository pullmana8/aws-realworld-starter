import { APIGatewayEvent } from "aws-lambda";
import container, { isLoaded } from "../container";
import * as Utils from "../utils";
import * as Services from "./services";
import * as Models from "./models";

export function register(request: APIGatewayEvent): Promise<Models.IUser> {
  return isLoaded.then(() => {
    const service = container.get<Services.IService>(Models.MODULE_TYPES.Service);
    return service.register(Utils.safeJsonParse(request.body || ""));
  });
}
