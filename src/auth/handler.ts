import "reflect-metadata";
import { wrapFunction } from "../utils/wrapper";
import * as main from "./main";

export const register = wrapFunction(main.register);
export const del = wrapFunction(main.del);
