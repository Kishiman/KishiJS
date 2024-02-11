import * as XLSX from 'xlsx';
import { Model, Sequelize } from 'sequelize';
import { KishiModel } from '../sequelize';
import { models } from '../models';
import { KArray } from '../utils/array';
interface ColumnInfo {
  name: string;
  sqlType: string;
  isRequired: boolean;
  foreignKey?: string;
}

function generateXlsx(models: (typeof KishiModel)[]): void {
  const workbook = XLSX.utils.book_new();

  for (const model of models) {
    const sheetName = model.name;
    const columns: ColumnInfo[] = [];

    // Get the column information for the model
    console.log("sheetName", sheetName);
    for (const [columnName, columnDefinition] of Object.entries(model.rawAttributes)) {
      console.log(columnName);

      const columnInfo: ColumnInfo = {
        name: columnName,
        sqlType: columnDefinition.type?.toString({}),
        isRequired: !!columnDefinition.allowNull,
      };
      if (columnDefinition.references) {
        columnInfo.foreignKey = typeof columnDefinition.references == "string" ? columnDefinition.references : columnDefinition.references.model?.toString();
      }
      columns.push(columnInfo);
    }

    // Create the sheet for the model
    const sheetData = [["name", ...KArray.get(columns, "name")]];
    sheetData.push(["sqlType", ...KArray.get(columns, "sqlType")]);
    sheetData.push(["isRequired", ...columns.map(col => col.isRequired ? 'Yes' : '')]);
    sheetData.push(["refernces", ...columns.map(col => col.foreignKey ?? '')]);

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  // Write the XLSX file
  XLSX.writeFile(workbook, 'docs/models.xlsx');
}
generateXlsx(Object.values(models))