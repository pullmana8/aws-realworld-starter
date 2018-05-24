import { APIGatewayEvent } from "aws-lambda";
import container, { isLoaded } from "../container";
import * as Utils from "../utils";
import * as Services from "./services";
import * as Models from "./models";

export function del(event: APIGatewayEvent): Promise<string> {
  const request: Models.IDeleteUserRequest = event as Models.IDeleteUserRequest;
  return isLoaded.then(() => {
    const service = container.get<Services.IService>(Models.MODULE_TYPES.Service);
    return service.del(Utils.safeDecodeUri(request.pathParameters.email, "[Auth.Main]::[del] "));
  });
}

export function login(event: APIGatewayEvent): Promise<Models.IUserProfileBody> {
  return isLoaded.then(() => {
    const service = container.get<Services.IService>(Models.MODULE_TYPES.Service);
    return service.login(Utils.safeJsonParse(event.body || "", "[Auth.Main]::[login] "));
  });
}

export function register(event: APIGatewayEvent): Promise<Models.IUserProfileBody> {
  return isLoaded.then(() => {
    const service = container.get<Services.IService>(Models.MODULE_TYPES.Service);
    return service.register(Utils.safeJsonParse(event.body || "", "[Auth.Main]::[register] "));
  });
}
