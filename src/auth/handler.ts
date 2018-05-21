import "reflect-metadata";
import { wrapFunction } from "../utils/wrapper";
import * as main from "./main";

export const del = wrapFunction(main.del);
export const login = wrapFunction(main.login);
export const register = wrapFunction(main.register);
