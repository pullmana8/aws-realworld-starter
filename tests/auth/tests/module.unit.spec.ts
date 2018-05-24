import chai = require("chai");
process.env["AUTH_TABLE_JWT_SECRET"] = "sweetsecretbruh";
import { MODULE_TYPES, IUserProfileBody } from '../../../src/auth/models';
import container, { isLoaded } from "../../../src/container";
import { IDynamoDBDocumentClient, DynamoTableWrapper, IDynamoTable, IDynamoSettings } from '../../../src/utils/dynamo-table';
import { register, login } from '../../../src/auth/main';
import { LambdaError } from '../../../src/utils/errors';
import { APIGatewayEvent } from 'aws-lambda';
import { Request } from 'aws-sdk/lib/request';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { AWSError } from 'aws-sdk/lib/error';
import { check422Expectations } from "../../util/fns.spec";

function generateDummyRequest(): Request<DocumentClient.DeleteItemOutput | DocumentClient.QueryOutput | DocumentClient.PutItemOutput, AWSError> {
  return {
    abort: null,
    createReadStream: null,
    eachPage: null,
    isPageable: null,
    send: null,
    on: null,
    promise: null,
    startTime: null,
    httpRequest: null
  } as any;
}

function generateApiEvent(pathParameters?: { [name: string]: string, id: string }): any {
  return {
    body: "",
    headers: { "key": "val" },
    httpMethod: "POST",
    isBase64Encoded: false,
    path: "sample",
    pathParameters: pathParameters,
    queryStringParameters: null,
    stageVariables: null,
    requestContext: null,
    resource: ""
  };
}

let mockDocumentClient: IDynamoDBDocumentClient = {
  delete: (_params: DocumentClient.DeleteItemInput, callback?: (err: AWSError, data: DocumentClient.DeleteItemOutput) => void): Request<DocumentClient.DeleteItemOutput, AWSError> => {
    (callback as any)(null, null);
    return generateDummyRequest();
  },
  put: (params: DocumentClient.PutItemInput, callback?: (err: AWSError, data: DocumentClient.PutItemOutput) => void): Request<DocumentClient.PutItemOutput, AWSError> => {
    (callback as any)(null, params.Item);
    return generateDummyRequest();
  },
  query: (params: DocumentClient.QueryInput, callback?: (err: AWSError, data: DocumentClient.QueryOutput) => void): Request<DocumentClient.QueryOutput, AWSError> => {
    let ret = [];
    if ((params.ExpressionAttributeValues as any)[":id"] === "123") {
      ret.push({
        id: "123",
        sample: "test1"
      });
    }
    if ((params.ExpressionAttributeValues as any)[":email"] === "abc@12.com") {
      ret.push({
        username: "abc12",
        email: "abc@12.com",
        passwordSalt: "12345"
      });
    }
    if ((params.ExpressionAttributeValues as any)[":email"] === "abc@1234.com") {
      ret.push({
        username: "abc1234",
        email: "abc@1234.com",
        passwordSalt: "6908291122ae57232c93f1e2e51a0006",
        passwordHash: "90068e29b6ed4df32bc5e5b4725ea4a207fc8b22c9afacaa522fe093deaec7b0f6a1a670e9fa91f678d25e7076352cd79d85be3c81de6706a2f4d8fa71e48c2ebaf4d5f228776e1cd914beff88500825f1b81e0a99be59bc8824a98ded92e0a1204b16d964fc4ac2b08678745ca18c2514b2a1dbcf921e920796c4c14a2025e4ce1689c559cdf28aa76e46f0a72c108d365d28c80f2cac2b2e484df1ce5d1c78c379e3f8d9251e559c44b3f45236648267d86f72912436b40f1dbdbbca6b97e0c3916c6b92b6455bdffee41526787305ad83a78022eddad9fbe3f924d908fd61afe51384ee1b86798891d1c9fb4fe9ca5a5f7d18bebb7b36addcfce3b5ce1de16be0291ea960e65793165b7cc31179300dd4d4ce0d31fc33f78d5f12a8be64c8e9bb087d760b992c1eb902a81a253bc6e806952fdb9efea553008e1e6b277894738d7293230c11f6866ae47cd75e64865040e9c3a7c71e4a65bb9a1894183f9691b31a78db14b850821c06817937113b1b5720ed7d588cbc0d283da45e779f96e814c5c144eb01eace3435bf8eaa1523323636c59e04695f3506ae55dc0d14c06f20b3d982dc0e364ed492c816eccd20cffc1c50706beb19fa987838b35f027af49c8e6e74e61a925a5180d06cae674026acfe5fd031748ea9a870e2d296d57caf141c9f1f5c454ea85acfb1bc6b42c5059552589a0faf31401f0772493b0072"
      });
    }
    (callback as any)(null, {
      Items: ret
    });
    return generateDummyRequest();
  }
};
let settings: IDynamoSettings = {
  addTimestamps: true,
  table: {
    idFields: ["id"],
    name: "blah"
  }
};
let dtw: DynamoTableWrapper = new DynamoTableWrapper();
dtw.documentClient = mockDocumentClient;
dtw.settings = settings;
isLoaded.then(() => {

  container.rebind<IDynamoTable>(MODULE_TYPES.Database).toConstantValue(dtw);

  describe('Auth Module CRUD', () => {

    let event: APIGatewayEvent;

    beforeEach(() => {
      event = generateApiEvent();
    });

    describe("Register function", () => {
      it("should throw 422 request validation errors - Missing user registration inforamtion error message", () => {
        event.body = "";
        return run422Expectations("Missing user information");
      });

      it("should throw 422 request validation errors - Missing field provided error message", () => {
        event.body = JSON.stringify({ user: { name: "whoop" } });
        return run422Expectations("Email, password, or username was not provided");
      });

      it("Register function should return a user that is registered", () => {
        event.body = JSON.stringify({ user: { username: "abc123", email: "abc@123.com", "password": "1234" } });
        return register(event)
          .then(body => {
            chai.expect(body).to.not.equal(null);
            chai.expect(body.user).to.not.equal(null);
            chai.expect(body.user).to.contain.keys("createTime", "id");
            chai.expect(body.user.email).to.equal("abc@123.com");
            chai.expect(body.user.username).to.equal("abc123");
          });
      });
    });

    describe("Login function", () => {
      it("should throw 422 request validation errors - Missing field provided error message", () => {
        event.body = "";
        return run422Expectations("Missing user information");
      });

      it("Should successfully login a user", () => {
        event.body = JSON.stringify({ user: { email: "abc@1234.com", "password": "1234" } });
        return login(event)
          .then(body => {
            chai.expect(body).to.not.equal(null);
            chai.expect(body.user).to.not.equal(null);
            chai.expect(body.user).to.contain.keys("token");
            chai.expect(body.user.email).to.equal("abc@1234.com");
            chai.expect(body.user.username).to.equal("abc1234");
          });
      });
    });

    function run422Expectations(body: string): Promise<void | IUserProfileBody> {
      return register(event)
        .catch(err => {
          const le: LambdaError = err as LambdaError;
          check422Expectations(le, body);
        });
    }
  });
});
