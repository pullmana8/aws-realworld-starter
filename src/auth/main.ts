import { APIGatewayEvent } from "aws-lambda";
import container from "../container";
import * as Utils from "../utils";
import * as Services from "./services";
import * as Models from "./models";

const service = container.get<Services.IService>(Models.MODULE_TYPES.Service);

export function register(request: APIGatewayEvent): Promise<Models.IUser> {
  return service.register(Utils.safeJsonParse(request.body || ""));
}
