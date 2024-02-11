import { AbstractDataType, Association, AssociationOptions, DataType, Dialect, ForeignKeyOptions, ModelAttributeColumnOptions, ModelOptions, Op, Optional, WhereAttributeHash, WhereOptions } from "sequelize";
import { UserEntity } from "../domain/entities";
import { KFunction } from "../utils/function";
import { KishiModel } from "./model";

/**
 * A custom Column DataType defintion with smart functionalities
 */

export interface KishiDataType extends AbstractDataType {
  /**
   * the literal field type, used for auto generating typescript interfaces
   * @example "string","Number","any"
   */
  ts_typeStr?: string;
  /**
   * name of the KishiModel
   * set by default
   */
  modelName: string;
  /**
   * name of the attribute
   * set by default 
   */
  attributeName: string;

  dialect: Dialect;
  /**
 * Init the DataTytpe to the column,
 * set custom code
 */
  Init?: (Model: typeof KishiModel, attribute: KishiModelAttributeColumnOptions) => void;
  /**
   * Hook the DataTytpe to the column,
   * set custom code
   */
  Hook?: (Model: typeof KishiModel) => void;
  /**
   * is this field a file? used for Router File Upload
   */
  isFile?: boolean;
  /**
   * is this field an array? TODO
   */
  isArray?: boolean;
  /**
   * List of consequtive getter functions
   */
  getters?: ((value: any) => any)[];
  /**
   * List of consequtive setter functions
   */
  setters?: ((value: any) => any)[];
  /**
   * custom compare function
   */
  compare?: (source: any, value: any) => boolean;
}

export function initDataType(Model: typeof KishiModel, attributeName: string, attribute: KishiModelAttributeColumnOptions) {
  let type = attribute.type as KishiDataType;
  type.modelName = Model.name;
  type.attributeName = attributeName;
  type.dialect = Model.sequelize?.getDialect() as Dialect;
  if (type.ts_typeStr)
    attribute.ts_typeStr = attribute.ts_typeStr || type.ts_typeStr
  if ((type.getters || []).length > 0) {
    const getChain = KFunction.chain(type.getters || [])
    attribute.get = function get() {
      const rawValue = this.getDataValue(attributeName)
      if (rawValue === undefined) return undefined
      return getChain(rawValue)
    }
  }
  if ((type.setters || [])?.length > 0) {
    const setChain = KFunction.chainReverse(type.setters || [])
    attribute.set = function set(value) {
      if (value === undefined) return undefined
      const rawValue = setChain(value)
      return this.setDataValue(attributeName, rawValue)
    }
  }
}

/**
 * @param name 
 * @returns sequelize operator in string format
 * @example KOp('in')=>"#in"
 */

export function KOp(name: keyof typeof Op) {
  return `#${name}`
}

export interface KishiModelAttributeColumnOptions extends ModelAttributeColumnOptions<KishiModel> {
  /**
   * can be updated
   */
  update?: boolean;
  /**
   * model names of custom dependencies
   * TODO
   */
  dependencies?: string[];
  /**
   * custom function for view, or false for invisible attributes
   */
  toView?: boolean | ((value: unknown) => unknown);
  /**
   * custom function from view, or false for not assignable from api
   */
  fromView?: boolean | ((value: unknown) => unknown);
  /**
   * custom where function
   * @example 
   * where:{"jsonField":"value"}=>where:{"#substring":"\"jsonField\":\"value\""}
   * //TODO
   */
  where?: boolean | ((value: WhereOptions<any>) => WhereOptions<any>);
  /**
   * the literal field type, used for auto generating typescript interfaces
   * @example "string","Number","any"
   */
  ts_typeStr?: string | ((imports: [string, string][]) => string);
  /**
   * bind this attribute to an association field
   * @example "string","Number","any"
   */
  binder?: TorArray<{
    associationName: string;
    targetField: string;
    sourceField?: string;
    hardBind?: boolean;
  }>
  counter?: {
    associationName: string;
    targetField: string;
    sourceField?: string;
  }
}
/**
 * Model Attributes to define a Model
 */

export type KishiModelAttributes = {
  [name in keyof Optional<any, never>]: DataType | KishiDataType | KishiModelAttributeColumnOptions;
};
export interface KishiModelOptions extends ModelOptions<KishiModel> { }


/**
 * Common KishiAssociationOptions for initializing the model
 */

export interface KishiAssociationOptions extends AssociationOptions {
  /**
   * name of target Model
   */
  target: string;
  /**
   * Target Model
   */
  Target?: typeof KishiModel;
  /**
   * type descriminator
   */
  type: "hasOne" | "belongsTo" | "hasMany" | "belongsToMany";
  /**
   * describes the Target action for each Source action
   */
  actionMap?: {
    /**
     * action when Source Model is created
     */
    Create?: "Create" | "Update" | "Upsert" | null;
    /**
     * action when Source Model is Updated and as in data
     */
    Update?: "Update" | "Upsert" | "UpsertDel" | "UpsertRemove" | null;
    /**
     * action when Source Model is Updated and idName in data
     */
    Link?: "Set" | "Add" | "SetDel" | null
  }
  as?: string;
  /**
   * field for getting/setting associations id
   * used to change only the association not the target  
   */
  idName?: string;
  foreignKey?: string | ForeignKeyOptions;
  foreignName?: string;
  /**
   * mapping schema from source to target
   * @example
   *   {
   * "pure":null,
   * "eager":"pure",
   * "sourceDeepSchema":"targetLessDeepSchema"
   * }
   */
  schemaMap?: Record<string, string | null>;
  /**
   * false for invisible association
   */
  toView?: boolean;
  /**
   * false for not assignable from api
   */
  fromView?: boolean;
  on?: WhereOptions;
  where?: WhereOptions;
}
/**
 * Final Association type used in runtime
 */

export interface KishiAssociation extends RequireSome<KishiAssociationOptions, "as" | "idName" | "foreignName" | "schemaMap" | "Target" | "actionMap"> {
  /**
   * the reverse of this assoication in the Target Model, if not exist autogenerated
   * defined as
   * @example
   * sourceKey==otherAssociation.targetKey
   * targetKey==otherAssociation.sourceKey
   */
  otherAssociation?: KishiAssociation;
  /**
  * the associations in the this Model that are exclusive with this association
  * defined as
  * @example
  * sourceKey==exclusiveAssociations.sourceKey
  */
  exclusiveAssociations: KishiAssociation[];
  /**
   * Source.sourceKey==Target.targetKey
   */
  sourceKey: string;
  /**
     * Source.sourceKey==Target.targetKey
     */
  targetKey: string;
}

export interface KishiBelongsToOptions extends KishiAssociationOptions {
  type: "belongsTo";
  parent?: boolean;
  actionMap?: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | null;
    Link?: "Set" | null;
  }
  foreignKey: string | ForeignKeyOptions;
  targetKey?: string;
  keyType?: DataType;
}

export interface KishiBelongsTo extends KishiAssociation {
  type: "belongsTo";
  parent?: boolean;
  realizer?: boolean;
  otherAssociation?: KishiHasMany | KishiHasOne;
  actionMap: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | null;
    Link?: "Set" | null;
  }
}

export interface KishiHasManyOptions extends KishiAssociationOptions {
  type: "hasMany";
  foreignKey: string | ForeignKeyOptions;
  otherAssociation?: KishiBelongsToOptions;
  actionMap?: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertDel" | "UpsertRemove" | null;
    Link?: "Set" | "Add" | "SetDel" | null
  }
  sourceKey?: string;
  keyType?: DataType;
}

export interface KishiHasMany extends KishiAssociation {
  type: "hasMany";
  otherAssociation?: KishiBelongsTo;
  actionMap: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertDel" | "UpsertRemove" | null;
    Link?: "Set" | "Add" | "SetDel" | null
  }
}

export interface KishiHasOneOptions extends KishiAssociationOptions {
  type: "hasOne";
  foreignKey: string | ForeignKeyOptions;
  actionMap?: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertDel" | null;
    Link?: "Set" | "SetDel" | null
  }
  sourceKey?: string;
  keyType?: DataType;
}

export interface KishiHasOne extends KishiAssociation {
  type: "hasOne";
  otherAssociation?: KishiBelongsTo;
  actionMap: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertDel" | null;
    Link?: "Set" | "SetDel" | null
  }
}

export interface KishiBelongsToManyOptions extends KishiAssociationOptions {
  type: "belongsToMany";
  through: string;
  Through?: typeof KishiModel;
  otherKey?: string | ForeignKeyOptions;
  sourceKey?: string;
  targetKey?: string;
  timestamps?: boolean;
  uniqueKey?: string;
  actionMap?: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertRemove" | null;
    Link?: "Set" | "Add" | null;
  }
}

export interface KishiBelongsToMany extends KishiAssociation {
  type: "belongsToMany";
  otherAssociation?: KishiBelongsToMany;
  through?: string;
  Through: typeof KishiModel;
  throughSourceKey: string;
  otherKey: string;
  actionMap: {
    Create?: "Create" | "Update" | "Upsert" | null;
    Update?: "Update" | "Upsert" | "UpsertRemove" | null;
    Link?: "Set" | "Add" | null;
  }
}

export type SplitAssociationPoint = {
  model: typeof KishiModel,
  pathToSource: string,
  pathToTarget: string,
}

export type typesOfKishiAssociationOptions = KishiBelongsToOptions | KishiBelongsToManyOptions | KishiHasManyOptions | KishiHasOneOptions
export type FinalAssociation = KishiBelongsTo | KishiBelongsToMany | KishiHasMany | KishiHasOne

export function isParent(association: FinalAssociation) {
  return association.type == "belongsTo" && association.parent == true
}

export function isChild(association: FinalAssociation) {
  return association.type == "hasOne" && association.otherAssociation?.parent == true
}

export function isInterface(association: FinalAssociation) {
  return association.type == "hasOne" && association.otherAssociation?.realizer == true
}

export function isRealizer(association: FinalAssociation) {
  return association.type == "belongsTo" && association.realizer == true
}

export function isPCIR(association: FinalAssociation) {
  return isParent(association) || isChild(association) || isInterface(association) || isRealizer(association)
}

export function isPI(association: FinalAssociation) {
  return isParent(association) || isInterface(association)
}

export type CrudResponse = boolean | WhereAttributeHash
export type CrudOption = CrudResponse | ((user?: UserEntity) => Async<CrudResponse>)
export interface CrudOptions {
  "create"?: CrudOption,
  "read"?: CrudOption,
  "update"?: CrudOption,
  "delete"?: CrudOption,
}