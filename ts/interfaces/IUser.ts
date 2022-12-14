import { IUserUserFollow } from "./IUserUserFollow";
import { IAdmin } from "./IAdmin";
import { IClient } from "./IClient";
import { INotification } from "./INotification";
import { INotification_User } from "./INotification_User";
import { IEvent } from "./IEvent";
import { IEvent_User } from "./IEvent_User";
export interface IUser {
	id?: string;
	activated?: boolean;
	passwordChangedDate?: Date;
	logoutDate?: Date;
	username?: string;
	email?: string;
	phoneNumber?: string;
	firstName?: string;
	lastName?: string;
	dateOfBirth?: Date;
	placeOfBirth?: string;
	profilePhoto?: { key: string, url: string };
	password?: string;
	fullName?: string;
	UserType?: 'Admin' | 'Client';
	createdAt?: Date;
	updatedAt?: Date;
	Admin?: Omit<IAdmin, "User">;
	AdminId?: string;
	Client?: Omit<IClient, "User">;
	ClientId?: string;
	notifications?: (Omit<INotification, "users" | "usersId"> & { Notification_User?: INotification_User })[];
	notificationsId?: (number)[];
	followers?: (Omit<IUser, "User_as_followers" | "User_as_followersId"> & { UserUserFollow?: IUserUserFollow })[];
	followersId?: (string)[];
	User_as_followers?: (Omit<IUser, "followers" | "followersId"> & { UserUserFollow?: IUserUserFollow })[];
	User_as_followersId?: (string)[];
	Event_as_users?: (Omit<IEvent, "users" | "usersId"> & { Event_User?: IEvent_User })[];
	Event_as_usersId?: (number)[];

}
