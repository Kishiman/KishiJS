import { config } from "../config";

import { Router } from "express"
import { KJUR } from "jsrsasign"
import axios from "axios";

import { KishiModel } from "../sequelize"
import { FileLogger } from "../utils/fileLogger";

const logger = new FileLogger("zoom")

const { zoom: { sdkKey, sdkSecret, accountId, clientId, clientSecret } } = config
let projectToken: string = ""
const oauthEP = new URL("https://zoom.us/oauth/token")
oauthEP.searchParams.append("grant_type", "account_credentials")
oauthEP.searchParams.append("account_id", accountId)
const authorization = new Buffer(`${clientId}:${clientSecret}`).toString("base64")



export class ZoomService {
  static async GenerateProjectToken() {
    try {
      if (projectToken) return
      logger.log("oauthEP", oauthEP.href);
      logger.log("authorization", authorization);
      const response = await axios.post(oauthEP.href, {}, {
        headers: {
          "Authorization": `Basic ${authorization}`
        }
      });
      const { status, data: { access_token, expires_in, scope } } = response
      // logger.log({ access_token, expires_in, scope });
      projectToken = access_token
      setTimeout(() => {
        projectToken = ""
      }, (expires_in - 60) * 1000)
    } catch (error: any) {
      throw error?.response?.data || error?.data || error?.message || "GenerateProjectToken failed"
    }
  }
  static async CreateMeeting() {
    await this.GenerateProjectToken()
    const response = await axios.post("https://api.zoom.us/v2/users/me/meetings", {}, {
      headers: {
        "Authorization": `Bearer  ${projectToken}`
      }
    })
    // logger.log(response.data);
    return response.data
  }
  static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
    ZoomService.GenerateProjectToken()
    router.post('/zoom/signature', async (req, res) => {
      const iat = Math.round((new Date().getTime() - 30000) / 1000)
      const exp = iat + 60 * 60 * 2
      const oHeader = { alg: 'HS256', typ: 'JWT' }
      const { id: meetingNumber, password } = await this.CreateMeeting()
      const oPayload = {
        sdkKey: sdkKey,
        appKey: sdkKey,
        mn: meetingNumber,
        role: req.body.role || 0,
        iat: iat,
        exp: exp,
        tokenExp: exp
      }
      const sHeader = JSON.stringify(oHeader)
      const sPayload = JSON.stringify(oPayload)
      const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret)
      res.status(200).send({ signature, meetingNumber, password })
    })

  }
}

