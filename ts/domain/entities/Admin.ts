import { UserEntity } from "./index";
export interface AdminEntity {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	User?: UserEntity;

}
