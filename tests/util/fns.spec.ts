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
