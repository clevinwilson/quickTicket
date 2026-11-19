import type { NextFunction, Request, RequestHandler, Response } from "express";

// A controller that may or may not return a promise. `unknown` rather than
// `void`, because `void` would hide a forgotten `await`.
type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown> | unknown;

const asyncHandler = (requestHandler: AsyncRequestHandler): RequestHandler => {
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((err: unknown)=>next(err));
    }
}

export  {asyncHandler, type AsyncRequestHandler }
