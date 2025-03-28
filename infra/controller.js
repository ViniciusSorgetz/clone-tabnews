import {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  ServiceError,
  NotFoundError,
} from "infra/errors";

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  if (error instanceof ValidationError) {
    console.error(error);
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof ServiceError) {
    console.error(error);
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof NotFoundError) {
    console.error(error);
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.log("\n Erro dentro do catch do next-connect");
  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
