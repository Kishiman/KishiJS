
import fs from "fs"

import { models } from '../models';
import { KishiDataType, KishiModel } from "../sequelize";
import { DataTypes } from "sequelize";
export function GetSwaggerFields(Model: typeof KishiModel): [string, string][] {
	let out: [string, string][] = []
	const attribtues = Model.getAttributes();
	// const queryGenerator = this.sequelize?.getQueryInterface().queryGenerator as any
	for (const attributeName in attribtues) {
		const attribute = attribtues[attributeName];
		const type = attribute.type
		let attTypeStr: any = "";
		const ts_typeStr = (attribute as any as KishiDataType).ts_typeStr
		if (ts_typeStr) {
			attTypeStr = ts_typeStr
		} else {
			const key = type.constructor.name as string
			switch (key as keyof typeof DataTypes) {
				case 'CITEXT':
				case 'STRING':
				case 'TEXT':
				case 'UUID':
				case 'UUIDV1':
				case 'UUIDV4':
					attTypeStr = "string"; break;
				case 'FLOAT': attTypeStr = "float"; break;
				case 'INTEGER':
				case 'TINYINT':
					attTypeStr = "integer"; break;
				case 'BOOLEAN':
					attTypeStr = "boolean"; break;
				case 'DATE':
				case 'DATEONLY':
					attTypeStr = "Date"; break;
				case 'ENUM':
					attTypeStr = "string"; break;
				default:
					attTypeStr = "object"
					console.warn(`${Model.name}.${attributeName}`);
					console.warn(type);
					break;
			}
		}
		out.push([attributeName, attTypeStr])
	}
	return out
}

function generateSwagger(models: (typeof KishiModel)[]): object {
	let swagger: any = {
		swagger: "2.0",
		paths: {},
		definitions: {},
	};

	models.forEach((Model) => {
		const modelName = Model.name;
		const swaggerFields = GetSwaggerFields(Model);

		// Create model definition
		const modelDefinition: any = {
			type: "object",
			properties: {},
		};

		swaggerFields.forEach(([fieldName, fieldType]) => {
			modelDefinition.properties[fieldName] = {
				type: fieldType,
			};
		});

		swagger.definitions[modelName] = modelDefinition;

		// Create CRUD paths
		const basePath = `/${modelName.toLowerCase()}`;

		if (Model.crudOptions.read) {
			// Create GET operation
			swagger.paths[basePath] = {
				get: {
					summary: `Get all ${modelName}`,
					responses: {
						200: {
							description: "OK",
							schema: {
								type: "object",
								properties: {
									row: {
										$ref: `#/definitions/${modelName}`,
									}
								},
							},
						},
					},
				},
			};
			// Create GET operation
			swagger.paths[`${basePath}/all`] = {
				get: {
					summary: `Get all ${modelName}`,
					responses: {
						200: {
							description: "OK",
							schema: {
								type: "object",
								properties: {
									count: {
										type: "integer",
									},
									rows: {
										type: "array",
										items: {
											$ref: `#/definitions/${modelName}`,
										},
									},
								},
							},
						},
					},
				},
			};

		}

		// Create POST operation
		if (Model.crudOptions.create) {
			swagger.paths[basePath] = {
				...(swagger.paths[basePath] || {}),
				post: {
					summary: `Create a new ${modelName}`,
					parameters: [
						{
							in: "body",
							name: "body",
							description: `The ${modelName} object`,
							required: true,
							schema: {
								$ref: `#/definitions/${modelName}`,
							},
						},
					],
					responses: {
						201: {
							description: "Created",
							schema: {
								type: "object",
								properties: {
									row: {
										$ref: `#/definitions/${modelName}`,
									}
								},
							},
						},
					},
				},
			};
		}

		if (Model.crudOptions.update) {
			swagger.paths[basePath] = {
				...(swagger.paths[basePath] || {}),
				patch: {
					summary: `Update ${modelName} by ID`,
					parameters: [
						{
							in: "path",
							name: "id",
							description: `The ID of the ${modelName}`,
							required: true,
							type: "string",
						},
						{
							in: "body",
							name: "body",
							description: `The updated ${modelName} object`,
							required: true,
							schema: {
								$ref: `#/definitions/${modelName}`,
							},
						},
					],
					responses: {
						200: {
							description: "OK",
							schema: {
								type: "object",
								properties: {
									row: {
										$ref: `#/definitions/${modelName}`,
									}
								},
							},
						},
						404: {
							description: `${modelName} not found`,
						},
					},
				},
				put: {
					summary: `Create Or Update ${modelName}`,
					parameters: [
						{
							in: "body",
							name: "body",
							description: `The updated ${modelName} object`,
							required: true,
							schema: {
								$ref: `#/definitions/${modelName}`,
							},
						},
					],
					responses: {
						200: {
							description: "OK",
							schema: {
								type: "object",
								properties: {
									row: {
										$ref: `#/definitions/${modelName}`,
									}
								},
							},
						},
						404: {
							description: `${modelName} not found`,
						},
					},
				},
			};
		}
		if (Model.crudOptions.update) {
			swagger.paths[basePath] = {
				...(swagger.paths[basePath] || {}),
				delete: {
					summary: `Delete ${modelName} by ID`,
					parameters: [
						{
							in: "path",
							name: "id",
							description: `The ID of the ${modelName}`,
							required: true,
							type: "string",
						},
					],
					responses: {
						204: {
							description: "No Content",
						},
						404: {
							description: `${modelName} not found`,
						},
					},
				},
			}
		}
	});
	return swagger
}
const swagger = generateSwagger(Object.values(models))
const json = JSON.stringify(swagger, null, "\t")
fs.writeFileSync('docs/swagger-models.json', json);

