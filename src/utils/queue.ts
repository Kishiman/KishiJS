import { PromiseLib, PromiseSub } from "./promise"

type BulkSub = {
	sub: PromiseSub,
	timer?: NodeJS.Timeout,
	values: any[],
}
var bulkRide: Record<any, BulkSub> = {}
type CoolDownSub = PromiseSub & {
	idx: number,
	date: number,
	next?: CoolDownSub,
}
var coolDown: Record<string, CoolDownSub> = {}
type QueueSub = PromiseSub & {
	idx: number,
	date: number,
	next?: CoolDownSub,
}
var queue: Record<string, QueueSub> = {}
const queuePromiseTimeout = 60
const bulkRideAwaitTime = 5 * 1000

export class QueueLib {
	static Wait(time = 10000): Promise<any> {
		let sub = PromiseLib.Create()
		setTimeout(() => { sub.resolve() }, time)
		return sub.promise
	}
	static BulkRide<T>(fn: (values: T[]) => any, value: T, awaitTime = bulkRideAwaitTime) {
		let promise = null
		let key = fn as any
		if (bulkRide[key]) {
			console.log("QueueLib.BulkRide");
			promise = bulkRide[key].sub.promise
			const { timer } = bulkRide[key]
			clearTimeout(timer)
			bulkRide[key].values.push(value)
		} else {
			let sub = PromiseLib.Create()
			bulkRide[key] = {
				sub,
				values: [value]
			}
		}
		const timer = setTimeout(async () => {
			const { sub, values } = bulkRide[key]
			delete bulkRide[key]
			try {
				sub.resolve(await fn(values))
			} catch (error) {
				sub.reject(error)
			}
		}, awaitTime)
		bulkRide[key].timer = timer
		return promise
	}
	static AwaitCooldown(key: string, cooldownTime: number) {
		let sub: Partial<CoolDownSub> = PromiseLib.Create()
		sub.promise?.finally(() => {
			// if (sub.idx && sub.idx > 0)
			//     console.warn(`AwaitCooldown[${key}](${cooldown}): sub[${sub.idx}] started\t delayed by ${Date.now() - (sub.date || 0)} ms`);
			setTimeout(() => {
				if (sub.next) {
					sub.next.resolve()
				} else {
					// console.warn(`AwaitCooldown[${key}](${cooldown}): queue cleared`);
					delete coolDown[key]
				}
			}, cooldownTime)
		})
		sub.date = Date.now()
		if (coolDown[key]) {
			sub.idx = coolDown[key].idx + 1
			// console.warn(`AwaitCooldown[${key}](${cooldown}): sub[${sub.idx}] waiting...`);
			coolDown[key].next = sub as CoolDownSub
		} else {
			sub.idx = 0
			// console.warn(`AwaitCooldown[${key}](${cooldown}): sub[${sub.idx}] started\t delayed by ${0} ms`);
			sub.resolve?.()
		}
		coolDown[key] = sub as CoolDownSub
		return sub.promise
	}
	static async AwaitQueue(key: string, timeout = queuePromiseTimeout): Promise<PromiseSub> {
		let sub: Partial<QueueSub> = PromiseLib.Create()
		let timeoutError = new Error()
		let timeoutCron = setTimeout(() => {
			timeoutError.message = `AwaitQueue[${key}]: sub[${sub.idx}] timed out after ${timeout} s`
			sub.reject?.(timeoutError);
		}, timeout * 1000);
		sub.promise?.finally(() => {
			// console.warn(`AwaitQueue[${key}]: sub[${sub.idx}] ended`);
			clearTimeout(timeoutCron)
			if (!sub.next) {
				// console.warn(`AwaitQueue[${key}]: queue cleared`);
				delete queue[key]
			}
		})
		sub.date = Date.now()
		if (queue[key]) {
			var prev = queue[key]
			sub.idx = prev.idx + 1
			prev.next = sub as QueueSub
			queue[key] = sub as QueueSub
			// console.warn(`AwaitQueue[${key}]: sub[${sub.idx}] waiting...`);
			await prev.promise.catch((error) => { console.error(error); })
			// console.warn(`AwaitQueue[${key}]: sub[${sub.idx}] started\t delayed by ${Date.now() - sub.date} ms`);
		} else {
			sub.idx = 0
			// console.warn(`AwaitQueue[${key}]: sub[${sub.idx}] started\t delayed by ${0} ms`);
			queue[key] = sub as QueueSub
		}
		return sub as QueueSub
	}
}
// QueueLib.AwaitQueue("queue").then(async (queue) => {
// 	await QueueLib.AwaitCooldown("cd1", 5000)
// 	console.log("cd1", 5000);
// 	await QueueLib.AwaitCooldown("cd1", 5000)
// 	console.log("cd1", 5000);
// 	queue.resolve("OOPS")
// 	queue.reject("OOPS")
// })
// QueueLib.AwaitQueue("queue").then(async (queue) => {
// 	await QueueLib.AwaitCooldown("cd2", 5000)
// 	console.log("cd2", 5000);
// 	await QueueLib.AwaitCooldown("cd2", 5000)
// 	console.log("cd2", 5000);
// 	queue.resolve()
// })