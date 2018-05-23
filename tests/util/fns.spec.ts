import chai = require("chai");
import * as Util from "../../src/utils";

export function check422Expectations(le: Util.Errors.LambdaError, errorMessage: string): void {
  chai.expect(le).to.be.an.instanceof(Util.Errors.LambdaError);
  chai.expect(le.statusCode).to.equal(422);
  chai.expect(le.type).to.equal("requestValidationError");
  chai.expect(le.errors).to.not.equal(undefined);
  chai.expect(le.errors).to.not.equal(null);
  chai.expect(le.errors.body).to.not.equal(undefined);
  chai.expect(le.errors.body).to.not.equal(null);
  chai.expect(le.errors.body.length).to.equal(1);
  chai.expect(le.errors.body[0]).to.equal(errorMessage);
}

describe("Index Utility Functions", () => {
  describe("Get Environment Variables", () => {
    it("Should get default values for missing environment variables", () => {
      chai.expect(Util.getEnvVar("lol", { lol: "sweet" })).to.equal("sweet");
    });
    it("Should override default values for present environment variables", () => {
      chai.expect(Util.getEnvVar("lol")).to.equal("");
      chai.expect(Util.getEnvVar("lol", { lol: undefined })).to.equal("");
      process.env.lol = "bruh";
      chai.expect(Util.getEnvVar("lol", { lol: "sweet" })).to.equal("bruh");
      chai.expect(Util.getEnvVar("lol", { lol: undefined })).to.equal("bruh");
    });
  });
  describe("Safe Decode URI", () => {
    it("Should return a decoded URI", () => {
      chai.expect(Util.safeDecodeUri("!%20*%20'%20(%20)%20;%20:%20@%20&%20=%20+%20$%20,%20/%20?%20%25%20#%20%5B%20%5D")).to.equal("! * ' ( ) ; : @ & = + $ , / ? % # [ ]");
    });
    it("Should safely handle a malformed encoded URI sequence", () => {
      chai.expect(Util.safeDecodeUri("%E0%A4%A")).to.equal("%E0%A4%A");
    });
  });
});
