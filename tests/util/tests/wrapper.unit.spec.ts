import chai = require("chai");
import { APIGatewayEvent } from "aws-lambda";
import wrapModule from "../../../src/utils/wrapper";
import { LambdaError } from "../../../src/utils/errors";

let sampleModule = {
  sampleSuccess: (_event: APIGatewayEvent): Promise<string> => {
    return Promise.resolve("Sweet test, bruh.");
  },
  sampleLambdaErr: (_event: APIGatewayEvent): Promise<string> => {
    return Promise.reject(LambdaError.notFound('SampleErr'));
  },
  sampleInternalErr: (_event: APIGatewayEvent): Promise<string> => {
    return Promise.reject(new Error("SampleErr"));
  },
  sampleLambdaThrow: (_event: APIGatewayEvent): Promise<string> => {
    throw LambdaError.notFound('ThrowTime');
  },
  sampleInternalThrow: (_event: APIGatewayEvent): Promise<string> => {
    throw new Error("Got ya!");
  }
};

let wrappedModule: any = wrapModule(sampleModule);

describe('API Gateway Wrapper', () => {

  it("Should wrap an entire module", () => {
    chai.expect(sampleModule.sampleSuccess).to.not.equal(wrappedModule.sampleSuccess);
    chai.expect(sampleModule.sampleLambdaErr).to.not.equal(wrappedModule.sampleLambdaErr);
    chai.expect(sampleModule.sampleInternalErr).to.not.equal(wrappedModule.sampleInternalErr);
  });

  it("Should return a success 200 lambda response wrapper", (done) => {
    wrappedModule.sampleSuccess(null, null, (_error?: Error | null, result?: any) => {
      chai.expect(result).contains.all.keys("statusCode", "body");
      chai.expect(result.statusCode).to.equal(200);
      chai.expect(result.body).to.equal('"Sweet test, bruh."');
      done();
    });
  });

  it("Should return a fail 500 lambda error wrapper", (done) => {
    wrappedModule.sampleLambdaErr(null, null, (_error?: Error | null, result?: any) => {
      chai.expect(result).contains.all.keys("statusCode", "body");
      chai.expect(result.statusCode).to.equal(404);
      chai.expect(result.body).to.equal('{"errors":{"body":["The resource `SampleErr` cannot be found"]},"type":"notFound"}');
      done();
    });
  });

  it("Should return a fail 500 internal error wrapper", (done) => {
    wrappedModule.sampleInternalErr(null, null, (_error?: Error | null, result?: any) => {
      chai.expect(result).contains.all.keys("statusCode", "body");
      chai.expect(result.statusCode).to.equal(500);
      chai.expect(result.body).to.equal('{"message":"An internal error occurred","type":"internalError"}');
      done();
    });
  });

  it("Should catch and return a fail 500 lambda error wrapper", (done) => {
    wrappedModule.sampleLambdaThrow(null, null, (_error?: Error | null, result?: any) => {
      chai.expect(result).contains.all.keys("statusCode", "body");
      chai.expect(result.statusCode).to.equal(404);
      chai.expect(result.body).to.equal('{"errors":{"body":["The resource `ThrowTime` cannot be found"]},"type":"notFound"}');
      done();
    });
  });

  it("Should catch and return a fail 500 internal error wrapper", (done) => {
    wrappedModule.sampleInternalThrow(null, null, (_error?: Error | null, result?: any) => {
      chai.expect(result).contains.all.keys("statusCode", "body");
      chai.expect(result.statusCode).to.equal(500);
      chai.expect(result.body).to.equal('{"message":"An internal error occurred","type":"internalError"}');
      done();
    });
  });

});
