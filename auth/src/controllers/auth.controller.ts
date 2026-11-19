import { ApiError } from "../utils/api-error.ts";
import { asyncHandler } from "../utils/async-handler.ts"


const signup =  asyncHandler((req, res) => {
    const { email, password } = req.body;
    res.send({status:"success"})
})

export {
    signup
}