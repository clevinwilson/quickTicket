// Generic over the payload instead of `data: any`, so `new ApiResponse(200,
// user)` keeps the type of `user` visible to whoever reads the controller.
class ApiResponse<T> {
    readonly statusCode: number;
    readonly data: T;
    readonly message: string;
    readonly success: boolean;

    constructor(statusCode: number, data: T, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }
