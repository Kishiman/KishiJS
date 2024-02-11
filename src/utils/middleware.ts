import { Request, RequestHandler, Response } from "express";

export type MiddlewareRequest = Request & { middleData: { [key: string]: any } }
export type Middleware = (req: MiddlewareRequest, res: Response) => any | Promise<any>;
export function MiddlewareChain(...middlewares: Middleware[]): RequestHandler {
  const handler: RequestHandler = async function (req, res, next) {
    try {
      (req as any).middleData = {}
      let result: any = {}
      for (const middleware of middlewares) {
        result = await middleware(req as MiddlewareRequest, res);
      }
      res.status(result?.status || 200).send(result)
    } catch (error) { console.error(error); res.status((error as any)?.status || 400).send(error) }
  }
  return handler

}

