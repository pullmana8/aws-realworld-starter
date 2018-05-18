import uuid = require("uuid");
import { injectable } from "inversify";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { AWSError } from "aws-sdk/lib/error";
import { Request } from "aws-sdk/lib/request";
import { LambdaError } from "./errors";

export interface IDynamoDBDocumentClient {
  delete(params: DocumentClient.DeleteItemInput, callback?: (err: AWSError, data: DocumentClient.DeleteItemOutput) => void): Request<DocumentClient.DeleteItemOutput, AWSError>;
  query(params: DocumentClient.QueryInput, callback?: (err: AWSError, data: DocumentClient.QueryOutput) => void): Request<DocumentClient.QueryOutput, AWSError>;
  put(params: DocumentClient.PutItemInput, callback?: (err: AWSError, data: DocumentClient.PutItemOutput) => void): Request<DocumentClient.PutItemOutput, AWSError>;
}

export interface IDynamoTable {
  documentClient: IDynamoDBDocumentClient;
  settings: IDynamoSettings;
  del(key: { [name: string]: any }): Promise<any>;
  get(keyConditionExpression: string, expressionAttributeValues: { [name: string]: any }): Promise<any[]>;
  put(data: any): Promise<any>;
}

export interface IDynamoSettings {
  table: {
    name: string;
    idFields: string[];
  };
  addTimestamps: boolean;
}

export type TableProvider = (settings: IDynamoSettings, client: IDynamoDBDocumentClient) => Promise<IDynamoTable>;
export const WRAPPER_KEY = Symbol("DynamoTableWrapper");

@injectable()
export class DynamoTableWrapper implements IDynamoTable {

  public settings: IDynamoSettings;
  public documentClient: IDynamoDBDocumentClient;

  del(key: { [name: string]: any }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.documentClient.delete({
        TableName: this.settings.table.name,
        Key: key
      }, (err) => {
        if (err) {
          reject(LambdaError.deleteDataFailed(err));
        } else {
          resolve();
        }
      });
    });
  }

  get(keyConditionExpression: string, expressionAttributeValues: { [name: string]: any }): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.documentClient.query({
        TableName: this.settings.table.name,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues
      }, (err, data) => {
        if (err || !data.Items || data.Items.length === 0) {
          reject(LambdaError.notFound(JSON.stringify(expressionAttributeValues)));
        } else {
          resolve(data.Items);
        }
      });
    });
  }

  put(data: any): Promise<any> {
    // If provided don't create a UUID on the property that is marked for auto uuid.
    if (this.settings.table.idFields) {
      this.settings.table.idFields.forEach((field) => {
        data[field] = data[field] || uuid.v1();
      });
    }
    if (this.settings.addTimestamps) {
      if (data.createTime) {
        data.updateTime = Date.now();
      } else {
        data.createTime = Date.now();
      }
    }
    return new Promise((resolve, reject) => {
      this.documentClient.put({
        TableName: this.settings.table.name,
        Item: data
      }, (err) => {
        if (err) {
          reject(LambdaError.putDataFailed(err));
        } else {
          resolve(data);
        }
      });
    });
  }

  // Dynamo DB scans are expensive - avoid doing this.
  // protected scan(): Promise<any[]> {
  //     return new Promise((resolve, reject) => {
  //         this._documentClient.scan({
  //             TableName: this._settings.dynamoTable.name,
  //             ConsistentRead: true
  //         }, (err, data) => {
  //             if (err) {
  //                 reject(LambdaError.internalError(err));
  //             } else {
  //                 let items = [];
  //                 if (data && data.Items) {
  //                     items = data.Items;
  //                 }
  //                 resolve(items);
  //             }
  //         });
  //     });
  // }
}
