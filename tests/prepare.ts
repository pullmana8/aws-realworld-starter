import * as Logging from "../src/utils/logging";
// No need to output anything to the console when running unit tests
Logging.setWriter((_msg: any, ..._rest: any[]) => undefined);
