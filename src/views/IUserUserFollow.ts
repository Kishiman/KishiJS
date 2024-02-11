import { IUser } from "./IUser";
export type IUserUserFollow = {
	id?: number;
	createdAt?: Date;
	updatedAt?: Date;
	UserId?: string;
	followerId?: string;

}
export const keysofIUserUserFollow: (keyof IUserUserFollow)[] = ["id", "createdAt", "updatedAt", "UserId", "followerId"]
