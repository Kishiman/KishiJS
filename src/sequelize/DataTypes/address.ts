import { DataTypes, Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "../";
import { KArray } from "../../utils/array";
import NodeGeocoder from 'node-geocoder'
import { geocode } from "../../services/geocoder";

export class Address implements KishiDataType {
  ts_typeStr: string = `NodeGeocoder.Entry`;
  key = "STRING";
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
    attribute.get = function get() {
      let entry: NodeGeocoder.Entry = {}
      if (`${attributeName}_geoPoint` in Model.getAttributes()) {
        const point = this.get(`${attributeName}_geoPoint`) as [number, number]
        entry.longitude = point[0]
        entry.latitude = point[1]
      }
      if (`${attributeName}_countryCode` in Model.getAttributes()) {
        entry.countryCode = this.get(`${attributeName}_countryCode`) as string
      }
      if (`${attributeName}_city` in Model.getAttributes()) {
        entry.city = this.get(`${attributeName}_city`) as string
      }
      if (`${attributeName}_street` in Model.getAttributes()) {
        const street = this.get(`${attributeName}_street`) as string
        const streetParts = street.split("::")
        entry.streetNumber = streetParts[0]
        entry.streetName = streetParts[1]
      }
      return entry
    }
    attribute.set = function set(entry: NodeGeocoder.Entry | null) {
      if (`${attributeName}_geoPoint` in Model.getAttributes()) {
        this.set(`${attributeName}_geoPoint`, entry ? [entry.longitude, entry.latitude] : null)
      }
      if (`${attributeName}_countryCode` in Model.getAttributes()) {
        this.set(`${attributeName}_countryCode`, entry?.countryCode || null)
      }
      if (`${attributeName}_city` in Model.getAttributes()) {
        this.set(`${attributeName}_city`, entry?.city || null)
      }
      if (`${attributeName}_street` in Model.getAttributes()) {
        this.set(`${attributeName}_street`, entry ? `${entry.streetNumber}::${entry.streetName}` : null)
      }
    }
  }
  public toSql(): string {
    return `BOOL`;
  }

  stringify = (value: any): string => {
    return value
  };

  get defaultValue() {
    const defaultValue = false as boolean;
    return defaultValue;
  }
}

(Sequelize as any).Address = Address;