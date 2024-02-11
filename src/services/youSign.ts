import { config } from "../config";

import axios from 'axios'
import fs from "fs";
import Path from "path";
import { Router } from "express";
import bodyParser from "body-parser";

import { KishiModel } from "../sequelize";
import { KArray } from "../utils/array";
import { AbstractFile } from "../utils/file";

const { server: { publicUrl } } = config;
const { yousign } = config

type Status = "draft" | "active" | "finished" | "expired" | "refused"
type ProcedureEvent = "started" | "finished" | "refused" | "expired"
type ProcedureRecepient = "@creator" | "@members" | "@subscribers" | "@subscribers.groupName"
type MemberEvent = "started" | "finished"
type MemberRecepient = "@creator" | "@members" | "@member" | "@subscribers" | "@subscribers.groupName"
interface FileObject {
	file: string,
	page: number,
	position?: string,
	mention?: string,
	mention2?: string,
}
interface Member {
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	operationLevel?: "custom",
	operationCustomModes?: ["email"],
	fileObjects?: FileObject[],
}
interface Procedure {
	name: string,
	description: string,
	members: Member[]
	metadata: any
}
export class YouSignService {
	static get statuses() {
		return ["draft", "active", "finished", "expired", "refused"]
	}
	static get headers() {
		return {
			"Authorization": "Bearer " + yousign.API_KEY,
			"Content-Type": "application/json"
		}
	}
	static async DownloadFile(fileId: string, path?: string): Promise<Buffer> {
		try {
			const url = "https://staging-api.yousign.com" + fileId + "/download" + "?alt=media"
			console.log("YouSign: downloading file from url:", url, "to path", path);
			const res = await fetch(url, { method: 'GET', headers: YouSignService.headers })
			const buffer = await (res as any).buffer()
			if (path) {
				const dirname = Path.dirname(path)
				if (!fs.existsSync(dirname)) {
					fs.mkdirSync(dirname, { recursive: true });
				}
				fs.writeFileSync(path, buffer)
			}
			return buffer as Buffer
		} catch (error) {
			console.error(error); throw `Download File from YouSign failed`
		}
	}
	static async CreateFileFromBuffer(buffer: Buffer, name: string) {
		try {
			const b64_buff = buffer.toString("base64")
			const fileBody = {
				"name": name,
				"content": b64_buff,
			}
			const res = await axios.post("https://staging-api.yousign.com/files", fileBody, { headers: YouSignService.headers })
			return res.data
		} catch (error) {
			const { request, response, ...others } = error as any
			console.error(response && response.data || error);
			throw `Create YouSign File Failed`

		}

	}
	static async CreateYSProcedure({ members, metadata, email = true }: any) {
		try {
			var procedureBody = YouSignService.genrateBasicProcedureBody(members, metadata, { email })
			const res = await axios.post("https://staging-api.yousign.com/procedures", JSON.stringify(procedureBody), { headers: YouSignService.headers })
			console.log(res.status);
			console.log(res.statusText);
			return res.data
		} catch (error) {
			const { response } = error as any
			console.error(response && response.data || error);
			throw `Create YouSign Procedure Failed`
		}
	}

	static genrateBasicProcedureBody(members: Member[], metadata: any, { email = true }) {
		members = Array.isArray(members) ? members : [members]
		for (let member of members) {
			member.phone = member.phone || "+21699999999"
			member.operationLevel = "custom"
			member.operationCustomModes = ["email"]
			member.fileObjects = []
			for (let fileObject of member.fileObjects || []) {
				fileObject.page = fileObject.page || 1
				fileObject.position = fileObject.position || "390,50,535,105"
				fileObject.mention = fileObject.mention || "Signed with love"
			}
		}
		var body = {
			"name": "Procedure",
			"description": "auto generated procedure of the mentioned member, duplicates can exist",
			"metadata": metadata,
			"members": members,
			"config": {
				"email": {
					"member.started": email ? [
						{
							"subject": "Invitation signature Infinity Bank",
							"message": "Bonjour <tag data-tag-type=\"string\" data-tag-name=\"recipient.firstname\"></tag> <tag data-tag-type=\"string\" data-tag-name=\"recipient.lastname\"></tag>, <br><br> Vous avez été invité à signer un document, veuillez cliquer sur le bouton suivant pour le lire  :<tag data-tag-type=\"button\" data-tag-name=\"url\" data-tag-title=\"Access to documents\">Access to documents</tag>",
							"to": ["@member"]
						}
					] : []
				},
				"router": {
					"member.finished": [
						{
							"url": publicUrl + "/hooks/yousign",
							"method": "POST",
							"headers": {
								"X-Custom-Header": "member.finished",
								"Content-Type": "application/json"
							}
						}
					],
				}
			}
		}
		return body;
	}
	static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
		router.use(bodyParser.urlencoded({ extended: false }));
		router.use(bodyParser.json());
		router.post('/hooks/yousign', async function (req, res, next) {
			try {
				const procedure = req.body.procedure;
				let { files, metadata: _metadata } = procedure;
				const { userId, ...metadata } = _metadata
				const { member } = req.body
				if (member) {
					files = KArray.get(member?.fileObjects || [], "file")
					files = KArray.idfy(files, "id")
				}
				if (userId) {
					//TODO
					// SocketService.NotifyUser(userId, {
					//     member
					// })
				}
				for (const meta of Object.values(metadata)) {
					const { fileId, modelName, id, attributeName } = meta as any
					const file = files.find((file: any) => file.id == fileId)
					if (!file) {
						continue
					}
					const Model = models[modelName]
					const instance = await Model.findByPk(id)
					if (instance) {
						const buffer = await YouSignService.DownloadFile(file.id)
						instance.set(attributeName, { name: file.name, data: buffer } as AbstractFile)
						await instance.save()
					}
				}
			} catch (error) {
				console.error(error);
				return res.sendStatus(400)
			}
			return res.sendStatus(200)
		})
		return router
	}

}
