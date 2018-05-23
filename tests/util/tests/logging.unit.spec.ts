import chai = require("chai");
import * as Logging from "../../../src/utils/logging";

describe('Logging Utility', () => {

  it("Should stringify message objects", () => {
    const output = Logging.Logger.generateOutput(Logging.LOG_LEVEL.DEBUG, Logging.Log.generateScope(), { ok: "sweet" });
    if (!output) {
      chai.assert.fail(output, {}, "Did not receive an expected output object back from the generateOutput method");
    } else {
      chai.expect(output.message).to.contain(`{\n  "ok": "sweet"\n}`);
    }
  });

  it("Should have default log level of debug", () => {
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.DEBUG);
  });

  it("Should change the log level to trace based on environment variable", () => {
    process.env.LOG_LEVEL = "TRACE";
    Logging.setLogLevelByEnvironmentVariable();
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.TRACE);
  });

  it("Should change the log level to debug based on environment variable", () => {
    process.env.LOG_LEVEL = "DEBUG";
    Logging.setLogLevelByEnvironmentVariable();
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.DEBUG);
  });

  it("Should change the log level to info based on environment variable", () => {
    process.env.LOG_LEVEL = "INFO";
    Logging.setLogLevelByEnvironmentVariable();
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.INFO);
  });

  it("Should change the log level to warn based on environment variable", () => {
    process.env.LOG_LEVEL = "WARN";
    Logging.setLogLevelByEnvironmentVariable();
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.WARN);
  });

  it("Should change the log level to error based on environment variable", () => {
    process.env.LOG_LEVEL = "ERROR";
    Logging.setLogLevelByEnvironmentVariable();
    chai.expect(Logging.currentLogLevel()).to.equal(Logging.LOG_LEVEL.ERROR);
  });

  it("Should generate and write trace output based on level", () => {
    Logging.setLogLevel(Logging.LOG_LEVEL.TRACE);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.TRACE, "")).to.not.equal(undefined);
    chai.expect(Logging.Logger.trace("")).to.equal(true);
    Logging.setLogLevel(Logging.LOG_LEVEL.NONE);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.TRACE, "")).to.equal(undefined);
    chai.expect(Logging.Logger.trace("")).to.equal(false);
  });

  it("Should generate and write debug output based on level", () => {
    Logging.setLogLevel(Logging.LOG_LEVEL.DEBUG);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.DEBUG, "")).to.not.equal(undefined);
    chai.expect(Logging.Logger.debug("")).to.equal(true);
    Logging.setLogLevel(Logging.LOG_LEVEL.NONE);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.DEBUG, "")).to.equal(undefined);
    chai.expect(Logging.Logger.debug("")).to.equal(false);
  });

  it("Should generate and write warn output based on level", () => {
    Logging.setLogLevel(Logging.LOG_LEVEL.WARN);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.WARN, "")).to.not.equal(undefined);
    chai.expect(Logging.Logger.warn("")).to.equal(true);
    Logging.setLogLevel(Logging.LOG_LEVEL.NONE);
    chai.expect(Logging.Logger.generateOutput(Logging.LOG_LEVEL.WARN, "")).to.equal(undefined);
    chai.expect(Logging.Logger.warn("")).to.equal(false);
  });

});
