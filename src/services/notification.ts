import { config } from "../config";

import { Router } from "express";
import { WhereOptions, CreateOptions, UpdateOptions } from "sequelize";
import { ModelHooks } from "sequelize/types/hooks";

import { KishiModel, KOp } from "../sequelize";
import { MailService } from "./mail";
import { SocketService } from "./socket";
import { WebPushService } from "./webPush";
import { FileLogger } from "../utils/fileLogger";
import { KArray } from "../utils/array";

import { UserEntity, NotificationEntity } from "../domain/entities";
import { User } from "../models/User";
import { Notification } from "../models/Notification";

const logger = new FileLogger("notification")

export type notifyMethod = "mail" | "wabPush" | "socket"
export interface NotificationOptions {
	notifyUsers(row: KishiModel): Async<string[] | WhereOptions>;
	notificationData(row: KishiModel): Async<{ message: string, metadata: any }>;
	methods: notifyMethod[],
	targetAttributes?: string[],
	noCreate?: boolean
}
export interface NotificationSource {
	notificationOptions: {
		onCreate?: NotificationOptions;
		onUpdate?: NotificationOptions | NotificationOptions[];
	}
}
async function getUsers(model: typeof KishiModel, row: KishiModel, options: NotificationOptions): Promise<(User & UserEntity)[]> {

	let users: User[] = []
	let usersToNotify = await options.notifyUsers(row)
	let userWhere: WhereOptions
	if ((usersToNotify as string[])?.length) {
		const paths = usersToNotify as string[]
		const reversePaths = Array.from(paths, path => model.ReversePath(path))
		let orList: WhereOptions[] = []
		reversePaths.forEach(path => orList.push({ [`$${path}.id$`]: row.id }))
		userWhere = orList.length == 1 ? orList[0] : { [KOp("or")]: orList }
	} else {
		userWhere = usersToNotify as WhereOptions
	}
	console.log(userWhere);
	users = await User.findAll({
		attributes: ["id", "email"],
		where: userWhere
	})
	return users as (User & UserEntity)[]
}
export class NotificationService {

	static async NotifyUser(user: UserEntity, notification: NotificationEntity, methods: notifyMethod[]) {
		if (methods.includes("mail")) {
			MailService.SendUserMessage(user, notification.message || "")
		}
		if (methods.includes("socket")) {
			SocketService.NotifyUser(user.id, notification)
		}
		if (methods.includes("wabPush")) {
			WebPushService.NotifyUser(user.id, notification)
		}
	}
	static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
		for (const modelName in models) {
			const model = (models[modelName]);
			if ((model as any as NotificationSource)?.notificationOptions) {
				let options = (model as any as NotificationSource)?.notificationOptions
				let { onCreate, onUpdate } = options
				const events: { hookName: keyof ModelHooks, option: NotificationOptions }[] = []
				if (onCreate)
					events.push({ hookName: "afterCreate", option: onCreate })
				if (onUpdate) {
					onUpdate = Array.isArray(onUpdate) ? onUpdate : [onUpdate]
					for (const onUpdate_ of onUpdate) {
						events.push({ hookName: "afterUpdate", option: onUpdate_ })
					}
				}
				for (const event of events) {
					const { hookName, option } = event
					model.addHook(hookName, async (row: KishiModel, options: UpdateOptions | CreateOptions) => {
						try {
							if (option.targetAttributes && options.fields) {
								const intersect = KArray.intersection(options.fields, option.targetAttributes)
								if (intersect.length == 0)
									return
							}
							let { message, metadata } = await option.notificationData(row)
							const users = await getUsers(model, row, option)
							let notification: Notification
							let notificationData = {
								message,
								ressourceId: row.id,
								ressourceName: model.name as any,
								type: hookName == "afterCreate" ? "Create" : "Update",
								users: KArray.get(users, "id"),
							} as NotificationEntity
							if (option.noCreate != false) {
								notification = await Notification.Create(notificationData) as Notification
							} else {
								notification = notificationData as any
							}
							for (const user of users) {
								await this.NotifyUser(user, notification as NotificationEntity, option.methods)
							}
						} catch (error) {
							logger.error(error)
						}
					})
				}
			}
		}
	}
}
