import { ModelHooks } from "sequelize/types/hooks";
import { KishiModel, KishiModelAttributes, KishiDataTypes, typesOfKishiAssociationOptions, CrudOptions, KishiModelOptions } from "../sequelize";
import { isOfType } from "../domain/User";

export class OpenAIResponseLog extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": (user) => (isOfType(user, "Admin")),
    "read": (user) => (isOfType(user, "Admin")),
    "update": (user) => (isOfType(user, "Admin")),
    "delete": (user) => (isOfType(user, "Admin")),
  }
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.STRING(38),
      primaryKey: true,
    },
    user: KishiDataTypes.STRING,
    object: KishiDataTypes.STRING,
    created: KishiDataTypes.DATE,
    model: KishiDataTypes.STRING,
    prompt_tokens: KishiDataTypes.INTEGER,
    completion_tokens: KishiDataTypes.INTEGER,
    total_tokens: KishiDataTypes.INTEGER,
    role: KishiDataTypes.STRING,
    systemPrompt: KishiDataTypes.TEXT,
    userPrompt: new KishiDataTypes.FILETEXT(),
    content: KishiDataTypes.TEXT,
    index: KishiDataTypes.INTEGER,
    finish_reason: KishiDataTypes.STRING,
  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
  };
  static initialHooks: Partial<ModelHooks<KishiModel, any>> = {
  }
  static initialOptions: KishiModelOptions = {
  }
}
