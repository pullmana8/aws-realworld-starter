import { MODULE_TYPES, IUser } from '../../../src/auth/models';
import container, { isLoaded } from "../../../src/container";
import { IDynamoDBDocumentClient, DynamoTableWrapper, IDynamoTable, IDynamoSettings } from '../../../src/utils/dynamo-table';
import { register } from '../../../src/auth/main';
import { LambdaError } from '../../../src/utils/errors';
import { APIGatewayEvent } from 'aws-lambda';
import { Request } from 'aws-sdk/lib/request';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { AWSError } from 'aws-sdk/lib/error';
import chai = require("chai");
// import catchChaiAssertionFailures from '../../utils/tests/chai-assertion-catch';

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

    describe("Register function should throw 422 request validation errors", () => {
      it("Missing user registration inforamtion error message", () => {
        event.body = "";
        return run422Expectations("Missing user registration information");
      });

      it("Missing field provided error message", () => {
        event.body = JSON.stringify({ name: "whoop" });
        return run422Expectations("Email, password, or username was not provided");
      });
    });

    function run422Expectations(body: string): Promise<void | IUser> {
      return register(event)
        .catch(err => {
          const le: LambdaError = err as LambdaError;
          check422Expectations(le, body);
        });
    }
  });
});

export function check422Expectations(le: LambdaError, errorMessage: string): void {
  chai.expect(le).to.be.an.instanceof(LambdaError);
  chai.expect(le.statusCode).to.equal(422);
  chai.expect(le.type).to.equal("requestValidationError");
  chai.expect(le.errors).to.not.equal(undefined);
  chai.expect(le.errors).to.not.equal(null);
  chai.expect(le.errors.body).to.not.equal(undefined);
  chai.expect(le.errors.body).to.not.equal(null);
  chai.expect(le.errors.body.length).to.equal(1);
  chai.expect(le.errors.body[0]).to.equal(errorMessage);
}
