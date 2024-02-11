import { config } from "../config";

import io from "socket.io"
import http from "http";
import https from "https";

import { KishiModel } from "../sequelize";
import { FileLogger } from "../utils/fileLogger";

let models: { [name: string]: typeof KishiModel } = {}
const socketsGroup: { [key: string]: io.Socket[] } = {}
const logger = new FileLogger("socket")

export class SocketService {
	static AddUserSocket(userId: any, socket: io.Socket) {
		(socket as any).userId = userId
		socketsGroup[userId] = socketsGroup[userId] || []
		socketsGroup[userId].push(socket)
		logger.log(`User[${userId}] Connected\tsockets(${socketsGroup[userId].length})`)
	}
	static NotifyUser(userId: any, notification: any) {
		const sockets = socketsGroup[userId] || [];
		logger.log(`User[${userId}]<--${notification.message || Object.keys(notification)}:${sockets.length}`)
		for (const socket of sockets) {
			socket.send(JSON.stringify(notification))
		}
	}

	static async DisconnectSocket(socket: io.Socket) {
		const userId = (socket as any).userId
		if (!userId) return
		socketsGroup[userId] = (socketsGroup[userId] || []).filter(_socket => _socket.id != socket.id)
		logger.log(`User[${userId}] Disconnected\tsockets(${socketsGroup[userId].length})`)
		const user = await models.User.findByPk(userId)
		if (!user) return
	}
	static Init(server: http.Server | https.Server, _models: { [name: string]: typeof KishiModel }) {
		models = _models
		let ioServer = new io.Server(server)
		ioServer.on("connection", async (socket: io.Socket) => {
			const token = socket.handshake.query["user-token"]
			try {
				//TODO
				//   const user = await verifyTokenSocket(socket, token)
				//   SocketService.AddUserSocket(user.id, socket);
			} catch (error) {
				console.error("token", token);
				console.error(error);
				return
			}
			socket.on("disconnect", async function () {
				SocketService.DisconnectSocket(socket)
			});
			socket.on("message", message => {
				console.log("Message Received: " + message);
				// ioServer.emit("message", { type: "new-message", text: message });
			});
		});
	}
}
