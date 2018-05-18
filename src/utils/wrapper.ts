import { Context, APIGatewayEvent } from "aws-lambda";
import * as Errors from "./errors";
import { Logger } from "./logging";

export function wrapFunction(func: (event: APIGatewayEvent) => Promise<any>): (event: APIGatewayEvent, context: Context, callback: AWSLambda.Callback) => void {
  return (event: APIGatewayEvent, _context: Context, callback: AWSLambda.Callback) => {
    try {
      func(event).then((data) => {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(data)
        });
      }).catch((reason: any) => {
        if (reason instanceof Errors.LambdaError) {
          Logger.error('Lambda error', reason);
          callback(null, reason.toLambda());
        } else {
          // An unexpected error occurred, log the error, dont send to user.
          Logger.error('Unexpected error', reason);
          callback(null, {
            statusCode: 500,
            body: JSON.stringify({
              message: Errors.INTERNAL_ERR.message,
              type: Errors.INTERNAL_ERR.type.internalError
            })
          });
        }
      });
    } catch (e) {
      if (e instanceof Errors.LambdaError) {
        Logger.error('Uncaught Lambda error', e);
        callback(null, e.toLambda());
      } else {
        Logger.error('Uncaught exception', e, e.stack);
        callback(null, {
          statusCode: 500,
          body: JSON.stringify({
            message: Errors.INTERNAL_ERR.message,
            type: Errors.INTERNAL_ERR.type.internalError
          })
        });
      }
    }
  };
}

export default function wrapModule(mod: any) {
  let out: any = {};
  for (let key in mod) {
    out[key] = wrapFunction(mod[key]);
  }
  return out;
}
