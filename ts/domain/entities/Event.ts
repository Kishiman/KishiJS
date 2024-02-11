import { UserEntity } from "./index";
import { Event_UserEntity } from "./index";
export interface EventEntity {
	id?: number;
	title?: string;
	flag?: 'Custom';
	startDate?: Date;
	endDate?: Date;
	allDay?: boolean;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
	users?: (UserEntity & { Event_User?: Event_UserEntity })[];
	usersId?: (string)[];

}
