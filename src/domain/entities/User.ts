import { ExternalTokenEntity } from "./index";
import { AdminEntity } from "./index";
import { ClientEntity } from "./index";
import { NotificationEntity } from "./index";
import { Notification_UserEntity } from "./index";
import { EventEntity } from "./index";
import { Event_UserEntity } from "./index";
export interface UserEntity {
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
	UserType?: 'Admin' | 'Client' | 'Moderator';
	createdAt?: Date;
	updatedAt?: Date;
	Admin?: AdminEntity;
	AdminId?: string;
	Client?: ClientEntity;
	ClientId?: string;
	notifications?: (NotificationEntity & { Notification_User?: Notification_UserEntity })[];
	notificationsId?: (number)[];
	ExternalToken_as_user?: (ExternalTokenEntity)[];
	ExternalToken_as_userId?: (string)[];
	Event_as_users?: (EventEntity & { Event_User?: Event_UserEntity })[];
	Event_as_usersId?: (number)[];
}