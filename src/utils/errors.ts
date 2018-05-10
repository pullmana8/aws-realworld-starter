// https://github.com/gothinkster/realworld/tree/master/api#errors-and-status-codes

export interface ILambdaError {
  errors: { body: string[]; };
  statusCode: number;
  type: string;

  toLambda(): {
    statusCode: number;
    body: string;
  };
}

export class LambdaError implements ILambdaError {
  errors = {
    body: []
  };

  constructor(public statusCode: number, public type: string, ...messages: string[]) {
    this.errors.body = messages;
  }

  static requestValidationError(...messages: string[]): ILambdaError {
    return new LambdaError(422, 'requestValidationError', ...messages);
  }

  static requestUnauthorizedError(...messages: string[]): ILambdaError {
    return new LambdaError(401, 'requestUnauthorizedError', ...messages);
  }

  static requestForbiddenError(...messages: string[]): ILambdaError {
    return new LambdaError(403, 'requestForbiddenError', ...messages);
  }

  static notFound(obj: string): ILambdaError {
    return new LambdaError(404, 'notFound', `The resource \`${obj}\` cannot be found`);
  }

  static internalError(err: { message: string }): ILambdaError {
    return new LambdaError(500, 'internalError', err.message);
  }

  static putDataFailed(err: { message: string }): ILambdaError {
    return new LambdaError(500, 'putFailed', err.message);
  }

  static deleteDataFailed(err: { message: string }): ILambdaError {
    return new LambdaError(500, 'deleteFailed', err.message);
  }

  toLambda() {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify({
        errors: this.errors,
        type: this.type
      })
    };
  }
}
