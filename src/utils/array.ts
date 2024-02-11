import { pathHead } from "./string"

export class KArray {
	static get(array: any[], key: string | Number | (string | Number)[]): any[] {
		key = Array.isArray(key) ? key : [key] as (string | Number)[]
		const [head, ...rest] = key
		if (rest.length > 0)
			return this.get(Array.from(array, (row) => row[head as any]), rest)
		return Array.from(array, (row) => row[head as any])
	}
	static desolve(items: any[]): any[] {
		if (!items) return []
		let out = []
		if (items[0] && Array.isArray(items[0]))
			for (const item of items)
				out.push(...item)
		else
			out = items
		return out
	}
	static getByPath(items: any[], path: string, options?: { desolve: boolean }): any[] {
		if (!items || items.length == 0)
			return []
		const [key, restPath, keys] = pathHead(path)
		let values = KArray.get(items, key)
		if (options?.desolve)
			values = this.desolve(values)
		if (keys.length == 1)
			return values
		else
			return this.getByPath(items, restPath, options)
	}
	static toValues(array: any[], key: string): any[] {
		return Array.from(array, (row) => (row && typeof row == "object" && key in row) ? row?.[key] : row).filter(value => value)
	}
	static toRecords(array: any[], key: string): any[] {
		return Array.from(array.filter(row => row), (row) => (row && typeof row == "object") ? row : { [key]: row })
	}
	static clense(array: any[]): any[] {
		return array.filter(row => row)
	}
	static intersection(source: any[], target: any[]): any[] {
		let out = []
		for (const _source of source) {
			for (const _target of target) {
				if (_source == _target)
					out.push(_source)
			}
		}
		return out
	}
	static includesOne<T extends any>(source: T[], target: T[]): boolean {
		return this.intersection(source, target).length > 0
	}
	static minus(source: any[], target: any[]): any[] {
		return source.filter(_source => {
			for (const _target of target) {
				if (_source == _target)
					return false
			}
			return true
		})
	}
	static groupBy<T extends any>(array: T[], key: keyof T | ((item: T) => keyof T)): Record<keyof T, T[]> {
		let out: Record<keyof T, T[]> = {} as Record<keyof T, T[]>
		for (const item of array) {
			let realKey: keyof T
			if ((typeof key == "function"))
				realKey = key(item)
			else
				realKey = key
			out[realKey] = out[realKey] || []
			out[realKey].push(item)
		}
		return out
	}
	static idfy<T extends any>(array: T[], key: keyof T | ((item: T) => keyof T)): T[] {
		return Object.values(this.groupByUnique(array, key))
	}
	static groupByUnique<T extends any>(array: T[], key: keyof T | ((item: T) => keyof T)): Record<keyof T, T> {
		let out: Record<keyof T, T> = {} as Record<keyof T, T>
		for (const item of array) {
			let realKey: keyof T
			if ((typeof key == "function"))
				realKey = key(item)
			else
				realKey = key
			out[realKey] = item
		}
		return out
	}
	static allSubSets<T extends any>(array: T[]): T[][] {
		if (array.length == 0) return [[]]
		const [head, ...rest] = array
		const noHeadSubsets = this.allSubSets(rest)
		const headSubsets = []
		for (const subSet of noHeadSubsets) {
			headSubsets.push([head, ...subSet])
		}
		return [...headSubsets, ...noHeadSubsets]
	}
	static Sort(array: string[], options = { reverse: false }) {
		const { reverse } = options
		if (array.length < 1) return array
		return array.sort((a: string, b: string) => {
			a = a.toLowerCase();
			b = b.toLowerCase();
			if (a == b) return 0
			if (!reverse)
				return a < b ? 1 : -1;
			return a < b ? -1 : 1;
		})
	}
}