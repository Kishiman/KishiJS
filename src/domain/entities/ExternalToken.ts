import { UserEntity } from "./index";
export interface ExternalTokenEntity {
	id?: number;
	UserType?: 'Admin' | 'Client' | 'Moderator';
	token?: string;
	ip?: string;
	expiresAt?: Date;
	type?: 'Google' | 'LinkedIn';
	createdAt?: Date;
	updatedAt?: Date;
	userId?: string;
	user?: UserEntity;

}
