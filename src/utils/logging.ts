import { injectable } from "inversify";

export const LOG_KEY = Symbol("util-logger");

export enum LOG_LEVEL {
  TRACE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE
}

let internalLogger: ILog;
let logLevel: LOG_LEVEL;

/**
 * Provides the ability to limit the log output at runtime to a certain level.
 * The levels are in order according to the LOG_LEVEL enumeration.
 *
 * @export
 * @param {LOG_LEVEL} value
 */
export function setLogLevel(value: LOG_LEVEL): void {
  logLevel = LOG_LEVEL.TRACE;
  internalLogger.info(`Log Level: ${LOG_LEVEL[value]} (${value})`);
  logLevel = value;
}

export interface ILogOut {
  (message: any, ...rest: any[]): boolean;
}

export interface ILog {
  trace: ILogOut;
  debug: ILogOut;
  info: ILogOut;
  warn: ILogOut;
  error: ILogOut;
  out: (level: LOG_LEVEL, message: any, ...rest: any[]) => boolean;
}

@injectable()
export class Log implements ILog {
  trace(message: any, ...rest: any[]): boolean {
    return this.out(LOG_LEVEL.TRACE, message, ...rest);
  }

  debug(message: any, ...rest: any[]): boolean {
    return this.out(LOG_LEVEL.DEBUG, message, ...rest);
  }

  info(message: any, ...rest: any[]): boolean {
    return this.out(LOG_LEVEL.INFO, message, ...rest);
  }

  warn(message: any, ...rest: any[]): boolean {
    return this.out(LOG_LEVEL.WARN, message, ...rest);
  }

  error(message: any, ...rest: any[]): boolean {
    return this.out(LOG_LEVEL.ERROR, message, ...rest);
  }

  out(level: LOG_LEVEL, message: any, ...rest: any[]): boolean {
    if (level < logLevel) {
      return false;
    }

    let outMessage = `\n[${new Date().toISOString()}] [${LOG_LEVEL[level]}] `;

    const stack = new Error("").stack || "";
    const locations = stack.split("at ");
    console.log("locations:", locations);
    if (locations.length > 2) {
      const location = locations[3];
      const scopeStart = location.indexOf("src/") + 4;
      const scopeEnd = location.search(/\.[tj]s/) + 1; // + 1 to keep the .
      const scope = location.substring(scopeStart, scopeEnd).replace(/\//g, ".");
      const caller = location.substr(0, location.indexOf(" ("));
      outMessage += `[${scope}${caller}] `;
    } else {
      outMessage += "[UNKNOWN_SCOPE_CALLER] ";
    }
    outMessage += typeof message === "string" ? message : JSON.stringify(message, undefined, 2);

    console.log(outMessage, ...rest);
    return true;
  }
}

internalLogger = new Log();
switch (process.env.LOG_LEVEL) {
  case "TRACE":
    setLogLevel(LOG_LEVEL.TRACE);
    break;
  case "INFO":
    setLogLevel(LOG_LEVEL.INFO);
    break;
  case "WARN":
    setLogLevel(LOG_LEVEL.WARN);
    break;
  case "ERROR":
    setLogLevel(LOG_LEVEL.ERROR);
    break;

  case "DEBUG":
  default:
    setLogLevel(LOG_LEVEL.DEBUG);
    break;
}
export const Logger = internalLogger;
