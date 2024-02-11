import { INotification } from "./INotification";
export type INotification_User = {
	id?: number;
	seenDate?: Date;
	createdAt?: Date;
	updatedAt?: Date;
	UserId?: string;
	NotificationId?: number;

}
export const keysofINotification_User: (keyof INotification_User)[] = ["id", "seenDate", "createdAt", "updatedAt", "UserId", "NotificationId"]
