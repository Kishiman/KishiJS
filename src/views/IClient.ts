import { IUser } from "./IUser";
export type IClient = Omit<IUser, "Client" | "Admin" | "ClientId" | "AdminId"> & {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	display?: string;
	UserType?: 'Client';

}
export const keysofIClient: (keyof IClient)[] = ["id", "createdAt", "updatedAt", "display", "UserType"]
