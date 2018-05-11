import { wrapFunction } from "../utils/wrapper";
import * as main from "./main";

export const register = wrapFunction(main.register);
