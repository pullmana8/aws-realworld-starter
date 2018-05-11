import * as Utils from "../utils";
import { Settings } from "./models";

export const DEFAULTS = new Settings(
  Utils.getEnvVar('EXAMPLE_SETTING', {
    EXAMPLE_SETTING: "bruh"
  })
);
