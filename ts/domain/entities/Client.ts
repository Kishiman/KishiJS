import { UserEntity } from "./index";
export interface ClientEntity {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	User?: UserEntity;

}
