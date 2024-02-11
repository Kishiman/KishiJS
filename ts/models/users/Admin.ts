import { ModelHooks } from "sequelize/types/hooks";
import { KishiModel, KishiModelAttributes, KishiDataTypes, typesOfKishiAssociationOptions, CrudOptions } from "../../sequelize";
import { User } from "../User";
import { config } from "../../config"
const { admin } = config
export class Admin extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": false,
    "read": false,
    "update": false,
    "delete": false,
  }
  static ParentModel = User;
  static WhereFromDisplay(display: string) {
    return this.FlattenWhere(User.WhereFromDisplay(display))
  }
  get display() {
    return (this.get("User") as User)?.display
  }
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.UUID,
      primaryKey: true,
      defaultValue: KishiDataTypes.UUIDV4,
    },
  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
  };
  static initialHooks: Partial<ModelHooks<KishiModel, any>> = {
    async afterSync(options) {
      const existing = await User.findOne({ where: { email: admin.email } })
      if (!existing) {
        await Admin.Create({ User: admin })
      }
    },
  }
}
