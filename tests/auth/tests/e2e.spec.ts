import "reflect-metadata";
import chai = require("chai");
import * as supertest from "supertest";
import { check422Expectations } from "./module.unit.spec";
import catchChaiAssertionFailures from "../../util/tests/chai-assertion-catch";
import { LambdaError } from "../../../src/utils/errors";
import { IUser, IUserRegistration } from "../../../src/auth/models";

// NOTE: Make sure the URL ends with a trailing slash
// npm run test:e2e
const request = supertest.agent("[[ENDPOINT]]");

function register(userReg: any): Promise<supertest.Response> {
  return superPromise('post', 'api/users', userReg);
}

function superPromise(method: string, endpoint: string, body?: any): Promise<supertest.Response> {
  return new Promise((resolve, reject) => {
    const stt: supertest.Test = (request as any)[method](endpoint);
    stt.send(body)
      .set('accept', 'json')
      .end((err: any, res: supertest.Response) => {
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
          check422Expectations(createLambdaError(response.body), "Missing user registration information");
        });
    });
    it('Should prevent null registration information', () => {
      return register(null)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Missing user registration information");
        });
    });
    it('Should prevent registration with missing fields', () => {
      const data: IUserRegistration = {
        email: "",
        password: "",
        username: ""
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing email', () => {
      const data: IUserRegistration = {
        email: "",
        password: "1234",
        username: "3456"
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing password', () => {
      const data: IUserRegistration = {
        email: "1234",
        password: "",
        username: "3456"
      };
      return register(data)
        .then(response => {
          chai.expect(response.status).to.equal(422);
          check422Expectations(createLambdaError(response.body), "Email, password, or username was not provided");
        });
    });

    it('Should prevent registration with missing username', () => {
      const data: IUserRegistration = {
        email: "1234",
        password: "567",
        username: ""
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
        .then(() => register({ email: "a@a.com", password: "1234", username: "abc123" }))
        .then(response => {
          const res = response.body as IUser;
          chai.expect(response.status).to.equal(200);
          chai.expect(res).to.not.equal(undefined);
          chai.expect(res).to.not.equal(null);
          chai.expect(res.email).to.equal("a@a.com");
          chai.expect(res.hasOwnProperty("password")).to.equal(false);
          chai.expect(res.hasOwnProperty("hash")).to.equal(false);
          chai.expect(res.hasOwnProperty("salt")).to.equal(false);
          chai.expect(res.username).to.equal("abc123");
        });
    });
  });

  describe('Cleanup', () => {
    it('Should delete the registered users', () => {
      return catchChaiAssertionFailures(Promise.resolve())
        .then(() => superPromise("del", encodeURI("api/users/a@a.com")))
        .then(response => {
          chai.expect(response.status).to.equal(200);
        });
    });
  });

});
