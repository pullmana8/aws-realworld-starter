import * as Errors from '../../../src/utils/errors';
import chai = require("chai");

describe('LambdaError', () => {

  let le: Errors.ILambdaError;

  it("Should return an internal error message", () => {
    le = Errors.LambdaError.internalError({ message: 'Some Error Message' });
    chai.expect(le.errors.body[0]).to.equal("Some Error Message");
    chai.expect(le.statusCode).to.equal(500);
    chai.expect(le.type).to.equal("internalError");
  });

  it("Should return a Not Found error", () => {
    le = Errors.LambdaError.notFound("abc123");
    chai.expect(le.errors.body[0]).to.equal("The resource `abc123` cannot be found");
    chai.expect(le.statusCode).to.equal(404);
    chai.expect(le.type).to.equal("notFound");
  });

  it("Should return a Put Data Failure Error", () => {
    let pdf = Errors.LambdaError.putDataFailed({ message: "Some Put Error Message" });
    chai.expect(pdf.errors.body[0]).to.equal("Some Put Error Message");
    chai.expect(pdf.statusCode).to.equal(500);
    chai.expect(pdf.type).to.equal("putFailed");
  });

  it("Should return a Delete Data Failure Error", () => {
    le = Errors.LambdaError.deleteDataFailed({ message: 'Some Delete Error Message' });
    chai.expect(le.errors.body[0]).to.equal("Some Delete Error Message");
    chai.expect(le.statusCode).to.equal(500);
    chai.expect(le.type).to.equal("deleteFailed");
  });

  it("Should return a Lambda response body", () => {
    let lambda = le.toLambda();
    chai.expect(lambda.body).to.equal('{"errors":{"body":["Some Delete Error Message"]},"type":"deleteFailed"}');
    chai.expect(lambda.statusCode).to.equal(500);
  });

  it("Should return an Unauthorized request Error", () => {
    le = Errors.LambdaError.requestUnauthorizedError('Some Unauthorized Error Message');
    chai.expect(le.errors.body[0]).to.equal("Some Unauthorized Error Message");
    chai.expect(le.statusCode).to.equal(401);
    chai.expect(le.type).to.equal("requestUnauthorizedError");
  });

  it("Should return a Forbidden request Error", () => {
    le = Errors.LambdaError.requestForbiddenError('Some Forbidden Error Message');
    chai.expect(le.errors.body[0]).to.equal("Some Forbidden Error Message");
    chai.expect(le.statusCode).to.equal(403);
    chai.expect(le.type).to.equal("requestForbiddenError");
  });

});
