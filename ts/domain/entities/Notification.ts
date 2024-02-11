import { UserEntity } from "./index";
import { Notification_UserEntity } from "./index";
export interface NotificationEntity {
	id?: number;
	type?: 'Custom' | 'Create' | 'Update';
	message?: string;
	ressourceName?: '';
	ressourceId?: string;
	triggeredBy?: string;
	createdAt?: Date;
	updatedAt?: Date;
	users?: (UserEntity & { Notification_User?: Notification_UserEntity })[];
	usersId?: (string)[];

}
