type RequireSome<T, TRequired extends keyof T> = T & Required<Pick<T, TRequired>>;
type Key<A, B> = (keyof A) & (keyof B)
type Async<T> = T | Promise<T>
type TorArray<T> = T | T[]