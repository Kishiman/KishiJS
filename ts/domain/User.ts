import { UserEntity } from "./entities";

export function isOfType(user: UserEntity | null | undefined, ...types: UserEntity["UserType"][]) {
  return types.includes(user?.UserType)
}
