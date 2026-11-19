/** One entry in the `errors` array - a field-level problem. */
type ApiErrorDetail = {
    message: string;
    field?: string;
};

class ApiError extends Error {
    readonly statusCode: number;
    readonly data: null;
    readonly success: boolean;
    readonly errors: ApiErrorDetail[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: ApiErrorDetail[] = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack= stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError, type ApiErrorDetail }
