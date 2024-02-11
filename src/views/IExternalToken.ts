import { IUser } from "./IUser";
export type IExternalToken = {
	id?: number;
	UserType?: 'Admin' | 'Client';
	token?: string;
	ip?: string;
	expiresAt?: Date;
	type?: 'Google' | 'LinkedIn';
	createdAt?: Date;
	updatedAt?: Date;
	userId?: string;
	user?: Omit<IUser, "ExternalToken_as_user" | "ExternalToken_as_userId">;

}
export const keysofIExternalToken: (keyof IExternalToken)[] = ["id", "UserType", "token", "ip", "expiresAt", "type", "createdAt", "updatedAt", "userId", "user"]
