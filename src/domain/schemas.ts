
import { models } from "../models"
import { User } from "../models/User"
export const schemas: Record<keyof typeof models, Record<string, string[]>> = {
    [User.name]: {
        "notifications": [
            "*",
            "notifications.id",
        ]
    },
}