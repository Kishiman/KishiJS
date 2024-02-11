import { DataTypes } from "sequelize";
import { FileS3Type } from "./FileS3Type";
import { FilesType } from "./FilesType";
import { NamedFilesType } from "./NamedFilesType";
import { FileType } from "./FileType";
import { HashedType } from "./HashedType";
import { JSONType } from "./JSONType";
import { ModelType } from "./ModelType";
import { MultiEnum } from "./MultiEnum";
import { Phone } from "./Phone";
import { Point } from "./Point";
import { Polygon } from "./Polygon";
import { FileText } from "./TextFileType";

export let KishiDataTypes = {
    ...DataTypes,
    MODEL: ModelType,
    MULTIENUM: MultiEnum,
    POINT: Point,
    POLYGON: Polygon,
    KJSON: JSONType,
    PHONE: Phone,
    FILE: FileType,
    FILES: FilesType,
    FILETEXT: FileText,
    NAMEDFILES: NamedFilesType,
    S3FILE: FileS3Type,
    HASH: HashedType
};