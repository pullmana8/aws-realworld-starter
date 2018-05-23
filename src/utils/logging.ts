import { injectable } from "inversify";

export const LOG_KEY = Symbol("util-logger");

let writer: (message?: any, ...optionalParams: any[]) => void = console.log;
export function setWriter(fn: (message?: any, ...optionalParams: any[]) => void): void {
  writer = fn;
}

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
export function currentLogLevel(): LOG_LEVEL {
  return logLevel;
}

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
  generateOutput: (level: LOG_LEVEL, message: any, ...rest: any[]) => { message: string, rest: any[] } | undefined;
  writeOutput(level: LOG_LEVEL, generatedOutput: { message: string, rest: any[] } | undefined): boolean;
}

@injectable()
export class Log implements ILog {

  static generateScope(): string {
    let scope = "UNKNOWN_SCOPE_CALLER";
    const stack: any = new Error("").stack;
    const locations = stack.split("at ");
    const location = locations[3];
    const scopeStart = location.indexOf("src/") + 4;
    const scopeEnd = location.search(/\.[tj]s/) + 1; // + 1 to keep the .
    const caller = location.substr(0, location.indexOf(" ("));
    scope = `${location.substring(scopeStart, scopeEnd).replace(/\//g, ".")}${caller}`;
    return scope;
  }

  trace(message: any, ...rest: any[]): boolean {
    return this.writeOutput(
      LOG_LEVEL.TRACE,
      this.generateOutput(LOG_LEVEL.TRACE, Log.generateScope(), message, ...rest)
    );
  }

  debug(message: any, ...rest: any[]): boolean {
    return this.writeOutput(
      LOG_LEVEL.DEBUG,
      this.generateOutput(LOG_LEVEL.DEBUG, Log.generateScope(), message, ...rest)
    );
  }

  info(message: any, ...rest: any[]): boolean {
    return this.writeOutput(
      LOG_LEVEL.INFO,
      this.generateOutput(LOG_LEVEL.INFO, Log.generateScope(), message, ...rest)
    );
  }

  warn(message: any, ...rest: any[]): boolean {
    return this.writeOutput(
      LOG_LEVEL.WARN,
      this.generateOutput(LOG_LEVEL.WARN, Log.generateScope(), message, ...rest)
    );
  }

  error(message: any, ...rest: any[]): boolean {
    return this.writeOutput(
      LOG_LEVEL.ERROR,
      this.generateOutput(LOG_LEVEL.ERROR, Log.generateScope(), message, ...rest)
    );
  }

  generateOutput(level: LOG_LEVEL, scope: string, message: any, ...rest: any[]): { message: string, rest: any[] } | undefined {
    if (level < logLevel) {
      return undefined;
    }
    let outMessage = `\n[${new Date().toISOString()}] [${LOG_LEVEL[level]}] [${scope}] `;
    outMessage += typeof message === "string" ? message : JSON.stringify(message, undefined, 2);
    return {
      message: outMessage,
      rest
    };
  }

  writeOutput(level: LOG_LEVEL, generatedOutput: { message: string, rest: any[] } | undefined): boolean {
    if (level < logLevel || generatedOutput === undefined || generatedOutput === null) {
      return false;
    }
    writer(generatedOutput.message, ...generatedOutput.rest);
    return true;
  }
}

internalLogger = new Log();
export function setLogLevelByEnvironmentVariable(): void {
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
}
setLogLevelByEnvironmentVariable();
export const Logger = internalLogger;
