type homoFunc = ((value: any) => any);
export class KFunction {
  static chain<T extends any>(funcs: (homoFunc)[]): (homoFunc) {
    funcs.filter(func=>func)
    if (funcs.length == 0) return (value: T): T => value;
    if (funcs.length == 1) return funcs[0];
    return (value: T) => {
      let out = value
      for (const func of funcs) {
        out = func(out)
      }
      return out
    }
  }
  static chainReverse<T extends any>(funcs: (homoFunc)[]): (homoFunc) {
    funcs.filter(func=>func)
    if (funcs.length == 0) return (value: T): T => value;
    if (funcs.length == 1) return funcs[0];
    return (value: T) => {
      let out = value
      for (let idx = funcs.length - 1; idx > -1; --idx) {
        out = funcs[idx](out)
      }
      return out
    }
  }
}
