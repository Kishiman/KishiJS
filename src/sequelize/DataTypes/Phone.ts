import { DataTypes, Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "../";


export class Phone implements KishiDataType {
	ts_typeStr?: string = `string`;
	key = "Phone";
	dialect: Dialect = "mysql";
	dialectTypes = "mysql";
	modelName: string = "";
	attributeName: string = "";
	getters?: ((value: any) => any)[] = [];
	setters?: ((value: any) => any)[] = [];
	constructor() {
		return this;
	}
	Init(Model: typeof KishiModel, attribute: KishiModelAttributeColumnOptions): void {
		const { attributeName } = this
		attribute.validate = {
			is: /^\+[1-9]\d{10,14}$/
		}
	}
	public toString() {
		return new DataTypes.STRING(15).toSql()
	}
	public toSql(): string {
		return new DataTypes.STRING(15).toSql()
	}

	stringify = (value: any): string => {
		return value
	};
	_sanitize = (value: any): any => {
		if (!value) return value;
		return value.replace(/\s/g, '')
	};

	get defaultValue() {
		const defaultValue = null as any;
		return defaultValue;
	}
}

(Sequelize as any).Phone = Phone;