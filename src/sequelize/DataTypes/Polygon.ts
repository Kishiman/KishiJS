import { Dialect, literal, Sequelize } from "sequelize";
import { Literal } from "sequelize/types/utils";
import { KishiDataType } from "../";


export class Polygon implements KishiDataType {
  ts_typeStr?: string = `[number,number][]`;
  key = "Polygon";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  constructor() {
    this.getters?.push((value: Literal) => {
      if (!value) return value
      switch (this.dialect) {
        case 'mysql':
          const geomStr = (value.val as string).slice("ST_GeomFromText('POLYGON(".length, (value.val as string).length - ")')".length)
          return geomStr.slice(1, geomStr.length - 1).split("),(").map(
            (polygonStr) => polygonStr.split(",").map(
              (pointStr) => {
                const [x, y] = pointStr.split(" ")
                return [Number(x), Number(y)]
              }
            )
          )[0]
        default:
          let points = (value.val as string).slice(2, (value.val as string).length - 2).split("),(")
          return points.map(point => {
            const [x, y] = point.split(",")
            return [Number(x), Number(y)]
          })
      }
    })
    this.setters?.push((value: [number,number][]) => {
      if (!value) return value
      const polygon = value as [number,number][]
      let geomStr
      switch (this.dialect) {
        case 'mysql':
          geomStr = `(${polygon.map(([x, y]) => `${x} ${y}`).join(",")})`
          return literal(`ST_GeomFromText('POLYGON(${geomStr})')`)
        default:
          geomStr = polygon.map(([x, y]) => `(${x},${y})`).join(",")
          return `(${geomStr})`
      }
    })
    return this;
  }
  public toString() {
    return "POLYGON";
  }
  public toSql(): string {
    return "POLYGON";
  }
  stringify = (value: any): string => {
    return value
  };
  _sanitize = (value: any, options: any): any => {
    if (!value) return value;
    if ((value as Literal).val) return value
    // console.log("Polygon__sanitize", value);
    switch (this.dialect) {
      case 'mysql':
        const polygons = value.coordinates as [number,number][][]
        const geomStr = polygons.map(polygon => `(${polygon.map(([x, y]) => `${x} ${y}`).join(",")})`).join(",")
        return literal(`ST_GeomFromText('POLYGON(${geomStr})')`)
      default:
        return literal(`${value}`)
    }
  };
}

(Sequelize as any).Polygon = Polygon;