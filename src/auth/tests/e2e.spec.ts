import chai = require("chai");
import { agent } from "supertest";
import catchChaiAssertionFailures from "../../utils/tests/chai-assertion-catch";
import { IUser, IUserRegistration } from "../models";

// NOTE: Make sure the URL ends with a trailing slash
// npm run test:e2e
const request = agent("https://9o02ithc3h.execute-api.us-east-1.amazonaws.com/dev/");

function register(userReg: IUserRegistration): Promise<IUser> {
  return new Promise((resolve, reject) => {
    request
      .post('api/users')
      .send(userReg)
      .set('accept', 'json')
      .end((err, res) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        resolve(res.body);
      });
  });
}

describe('Register User Scenarios', () => {

  let model1: IUserRegistration;

  describe('Success scenarios', () => {

    it('Should successfully register a user', () => {
      return catchChaiAssertionFailures(Promise.resolve())
        .then(() => register({ email: "", password: "", username: "" }))
        .then(_res => {
          console.log(_res);
          chai.expect(true).to.equal(false);
          return model1;
        });
    });

    // it('Throw 404 not found', () => {
    //   return catchChaiAssertionFailures(Promise.resolve())
    //     .then(() => request.get('does-not-exist').send())
    //     .then(res => {
    //       chai.expect(res.status).to.be.equal(404, "Expected Status Code 404 Not Found");
    //     });
    // });

    // it('Throw for an invalid Model', () => {
    //   return catchChaiAssertionFailures(Promise.resolve())
    //     .then(() => request.get('error').send())
    //     .then(res => {
    //       chai.expect(res.status).to.be.equal(401, "Expected Status Code 401 Not Authorized");
    //       chai.expect(JSON.stringify(res.body)).to.be.equal('{"errors":{"body":["Access Error"]},"type":"requestUnauthorizedError"}');
    //     });
    // });
  });

});
