import "reflect-metadata";
import chai = require("chai");
import * as supertest from "supertest";
import * as jwt from "jsonwebtoken";
import { SSM, config } from "aws-sdk";
import { check422Expectations } from "../../util/fns.spec";
import catchChaiAssertionFailures from "../../util/tests/chai-assertion-catch";
import { LambdaError } from "../../../src/utils/errors";
import { IUserProfileBody, IUserAuthBody } from "../../../src/auth/models";

// NOTE: Make sure the URL ends with a trailing slash
// npm run test:e2e
const request = supertest.agent("[[ENDPOINT]]");

function register(userReg: any): Promise<supertest.Response> {
  return superPromise('post', 'api/users', userReg);
}

function superPromise(method: string, endpoint: string, body?: any, userToken?: string | null): Promise<supertest.Response> {
  return new Promise((resolve, reject) => {
    const stt: supertest.Test = (request as any)[method](endpoint);
    stt.send(body);
    if (userToken) {
      stt.set('Authorization', `Token ${userToken}`);
    }
    stt.set('accept', 'json');
    stt.end((err: any, res: supertest.Response) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

describe('Register User Scenarios', () => {

  describe('Validation scenarios', () => {
    it('Should prevent undefined registration information', () => {
      return register(undefined)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Missing user information");
        });
    });
    it('Should prevent null registration information', () => {
      return register(null)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Missing user information");
        });
    });
    it('Should prevent registration with missing fields', () => {
      const data: IUserAuthBody = {
        user: {
          email: "",
          password: "",
          username: ""
        }
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing email', () => {
      const data: IUserAuthBody = {
        user: {
          email: "",
          password: "1234",
          username: "3456"
        }
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing password', () => {
      const data: IUserAuthBody = {
        user: {
          email: "1234",
          password: "",
          username: "3456"
        }
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing username', () => {
      const data: IUserAuthBody = {
        user: {
          email: "1234",
          password: "567",
          username: ""
        }
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    function createLambdaError(js: any): LambdaError {
      return new LambdaError(422, js.type, js.errors.body[0]);
    }
  });

  describe('Success scenarios', () => {

    it('Should successfully register a user', () => {
      return catchChaiAssertionFailures(Promise.resolve())
        .then(() => register({ user: { email: "a@a.com", password: "1234", username: "abc123" } }))
        .then(response => {
          const body = response.body as IUserAuthBody;
          chai.expect(response.status).to.equal(200);
          chai.expect(body).to.not.equal(undefined);
          chai.expect(body).to.not.equal(null);
          chai.expect(body.user).to.not.equal(undefined);
          chai.expect(body.user).to.not.equal(null);
          chai.expect(body.user.email).to.equal("a@a.com");
          chai.expect(body.user.hasOwnProperty("password")).to.equal(false);
          chai.expect(body.user.hasOwnProperty("hash")).to.equal(false);
          chai.expect(body.user.hasOwnProperty("salt")).to.equal(false);
          chai.expect(body.user.username).to.equal("abc123");
        });
    });
  });

});

let userToken: string | null;
describe('Login User Scenarios', () => {
  it('Should successfully login', () => {
    return catchChaiAssertionFailures(Promise.resolve())
      .then(() => superPromise('post', 'api/users/login', { user: { email: "a@a.com", password: "1234" } }))
      .then(response => {
        chai.expect(response.status).to.equal(200);
        const body: IUserProfileBody = response.body;
        chai.expect(body.user.email).to.equal("a@a.com");
        chai.expect(body.user.username).to.equal("abc123");
        chai.expect(body.user.token).to.not.equal(undefined);
        userToken = body.user.token;
        try {
          jwt.verify(body.user.token || "", "thisisnotthekeyyourelookingfor");
          throw new Error("This should not succeed, your key is `thisisnotthekeyyourelookingfor`. Really?");
        } catch (err) {
          chai.expect(err.message).to.equal("invalid signature");
        }
        return new Promise((resolve, reject) => {
          config.region = "us-east-1";
          new SSM().getParameter({
            Name: "real-world-auth-jwt-secret-dev", WithDecryption: true
          }, (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          });
        }).then((result: SSM.Types.GetParameterResult) => {
          chai.expect(result).to.not.equal(undefined);
          chai.expect(result).to.not.equal(null);
          chai.expect(result.Parameter).to.not.equal(undefined);

          // Conditionals to ignore Typescript compile errors on potentially undefined values
          if (result && result.Parameter) {
            chai.expect(result.Parameter.Value).to.not.equal(undefined);
          }
          if (result && result.Parameter && result.Parameter.Value) {
            const decoded: any = jwt.verify(body.user.token || "", result.Parameter.Value);
            chai.expect(decoded.username).to.equal(body.user.username);
            chai.expect(decoded.email).to.equal(body.user.email);
            chai.expect(decoded.createTime).to.equal(body.user.createTime);

            const now = new Date().getTime();
            // TODO: Look up config value; Assuming 30 minutes for now
            const expiration = new Date(now + 1800000).getTime();

            // Within 6 seconds of when this test runs
            let start = Math.floor(new Date(now - 2000).getTime() / 1000);
            let end = Math.floor(new Date(now + 4000).getTime() / 1000);
            chai.expect(decoded.iat).to.be.greaterThan(start).and.lessThan(end);

            // Within 6 seconds of when this test runs
            start = Math.floor(new Date(expiration - 2000).getTime() / 1000);
            end = Math.floor(new Date(expiration + 4000).getTime() / 1000);
            chai.expect(decoded.exp).to.be.greaterThan(start).and.lessThan(end);
          }
        });
      });
  });
});

describe('Update User Scenarios', () => {
  it('Should successfully update a user', () => {
    return catchChaiAssertionFailures(Promise.resolve())
      .then(() => superPromise("put", "api/user", { user: { email: "toats@new.com", username: "toatsnew", bio: "some pig", image: "someurl" } }, userToken))
      .then(response => {
        chai.expect(response.status).to.equal(200);
        const body: IUserProfileBody = response.body as IUserProfileBody;
        chai.expect(body.user).to.not.equal(undefined);
        chai.expect(body.user.email).to.equal("toats@new.com");
        chai.expect(body.user.username).to.equal("toatsnew");
        chai.expect(body.user.image).to.equal("someurl");
        chai.expect(body.user.bio).to.equal("some pig");
        chai.expect(body.user.token).to.not.equal(null);
        chai.expect(body.user.token).to.not.equal(undefined);
        chai.expect(body.user).to.include.keys("updateTime", "createTime");
      });
  });
});

describe('Cleanup', () => {
  it('Should delete the registered users', () => {
    return catchChaiAssertionFailures(Promise.resolve())
      .then(() => superPromise("del", encodeURI("api/users/toats@new.com")))
      .then(response => {
        chai.expect(response.status).to.equal(200);
      });
  });
});
