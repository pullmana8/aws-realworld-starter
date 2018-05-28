import "reflect-metadata";
import { setDefault, IHookProperties } from "ts-log-class";
import { Logger } from "../utils/logging";

setDefault({
  hook: (logProps: IHookProperties) => {
    if (logProps.arguments.hasOwnProperty("user")) {
      const user: any = JSON.parse(logProps.arguments.user);
      user.password = "[secret]";
      logProps.arguments.user = JSON.stringify(user);
    }
    return JSON.stringify(logProps);
  },
  out: (message?: any, ...optionalParameters: any[]) => {
    Logger.debug(message, optionalParameters);
  }
});

import { wrapFunction } from "../utils/wrapper";
import * as main from "./main";

export const del = wrapFunction(main.del);
export const getUserByToken = wrapFunction(main.getUserByToken);
export const login = wrapFunction(main.login);
export const register = wrapFunction(main.register);
export const update = wrapFunction(main.update);
