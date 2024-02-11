import { config } from "../config";

import AWS from "aws-sdk"

import { AbstractFile } from "../utils/file";
import { FileLogger } from "../utils/fileLogger";


const { S3 } = config

const s3 = new AWS.S3({
  accessKeyId: S3.API_KEY,
  secretAccessKey: S3.API_SECRET,
  region: S3.REGION,
  signatureVersion: "v4",
});
const logger = new FileLogger("FileManagerError")

export class AWSS3Service {
  static get urlPrefix() {
    return S3.urlPrefix
  }
  static async UploadFile(payload: AbstractFile[], putParams: Partial<AWS.S3.Types.PutObjectRequest>): Promise<AWS.S3.ManagedUpload.SendData[]> {
    try {
      let data: AWS.S3.ManagedUpload.SendData[] = [];
      for (let file of payload) {
        let params: AWS.S3.Types.PutObjectRequest = {
          Bucket: S3.BUCKET,
          Body: file.data,
          Key: file.name,
          // ContentType: file.mimetype,
          ...putParams,
        }
        const stored = await s3.upload(params).promise();
        data.push(stored)
      }
      return data;
    } catch (error) {
      logger.error(error)
      console.error(error);
      return []
    }
  }

  static async GetFile(keys: string[]): Promise<any[]> {
    let files: any[] = [];
    try {
      for (let key of keys) {
        const file = await s3.getObject({
          Key: key,
          Bucket: S3.BUCKET,
        }).promise();
        files.push(file);
      }
      return files;
    } catch (error) {
      logger.error(error)
      console.error(error);
      return files
    }
  }

  static async DeleteFile(keys: string[]): Promise<string[]> {
    let deleted: string[] = []
    try {
      for (let key of keys) {
        await s3.deleteObject({
          Bucket: S3.BUCKET,
          Key: key,
        }, () => { }).promise();
        deleted.push(key)
      }
      return deleted
    } catch (error) {
      logger.error(error)
      console.error(error);
      return deleted

    }
  }
}
