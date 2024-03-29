import { pathHead } from "./string";

export function forKey(obj: Object, cb: (key: keyof Object, value: any) => void): void {
  for (const idx in Object.keys(obj)) {
    const key = Object.keys(obj)[idx] as keyof typeof obj;
    cb(key, obj[key]);
  }
}
export function flatToDeep(obj: any, options: { seperator: string } = { seperator: "." }): any {
  if (!obj) return obj
  if (Array.isArray(obj)) {
    return Array.from(obj, obj_ => flatToDeep(obj_, options))
  }
  if (typeof obj != "object") {
    return obj;
  }
  let out: any = {}
  if (obj?.prototype) {
    obj.prototype.name
  }
  const seperator = options.seperator
  for (const key in obj) {
    const [head, ...tails] = key.split(seperator)
    if (tails.length > 0) {
      const _nested = flatToDeep({ [tails.join(seperator)]: obj[key] }, options)
      if (_nested) {
        out[head] = out[head] || {}
        out[head] = { ...out[head], ..._nested }
      }
    } else {
      out[key] = flatToDeep(obj[key], options)
    }
  }
  return out
}
export function ObjectToXML(item: any, stack = 0) {
  if (typeof item != "object")
    return new String(item)
  const tab = "\t".repeat(stack)
  let out = "\n"
  if (Array.isArray(item)) {
    if (typeof item[0] != "object")
      return item.join(",")
    for (const _item of item) {
      out += tab + ObjectToXML(_item, stack + 1).replace(/\n/g, "\n" + tab) + "\n"
    }
    return out
  }
  for (const key in item) {
    if (key.startsWith("$")) {
      out += `${tab}<${key.substring(1)}/>\n`
      continue
    }
    if (Array.isArray(item[key])) {
      for (const _item of item[key]) {
        out += `${tab}<${key}>${ObjectToXML(_item, stack + 1).replace(/\n/g, "\n" + tab)}</${key}>\n`
      }
      continue
    }
    out += `${tab}<${key}>${ObjectToXML(item[key], stack + 1).replace(/\n/g, "\n" + tab)}</${key}>\n`
  }
  return out
}
export function getKey(object: any, value: any): string | undefined {
  return Object.keys(object).find(key => object[key] === value);
}
export function getDeepValue(object: any, path = ""): any {
  const [head, restPath] = pathHead(path)
  if (restPath) {
    if (typeof object[head] == "object")
      return getDeepValue(object[head], restPath)
    return undefined
  }
  return object[head]
}
export function setDeepValue(object: any, path = "", value: any): void {
  const [head, restPath] = pathHead(path)
  const key = !isNaN(Number(head)) && Array.isArray(object) ? Number(head) : head
  if (restPath) {
    if (!(key in object))
      object[key] = {}
    return setDeepValue(object[key], restPath, value)
  }
  return object[key] = value
}
export function reduce(object: any, bans = ["", null, [], {}, undefined]): any {
  var target: any = {}
  for (const key in object) {
    var value = object[key]
    if (typeof object[key] == "object")
      value = reduce(object[key])
    if (bans.includes(value) || (Array.isArray(value) && value.length == 0) || JSON.stringify(value) == JSON.stringify({}))
      continue
    target[key] = value
  }
  return target
}