import axios from "axios";
import http from "http";
import https from "https";
import { config } from "../config";
import serverSync from "../server";
const { server: serverConfig } = config;
const { auth: { passwordSecret } } = config

function encodePasswordFront(password: string): string {
  if (!passwordSecret) return password;
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ password }), passwordSecret)
  return encrypted.toString();
}
const coreurl = `http://127.0.0.1:${serverConfig.port}`
serverSync.then(async (server: http.Server | https.Server) => {
  try {
    const seed = Date.now()
    const headers: any = {};

    //user minimum info
    let signUpPayload = {
      email: `${seed}@yopmail.com`,
      password: seed.toString(),
      //UserType must be "client"
      UserType: "Client",
    }
    //encrypt password usinf the secret in env
    signUpPayload.password = encodePasswordFront(signUpPayload?.password as any)
    //sign up
    const signUpResponse = await axios.post(`${coreurl}/auth/SignUp`, signUpPayload, { headers, validateStatus(status) { return true }, })
    if (signUpResponse.status == 200) {
      if (signUpResponse.data.user.email != signUpPayload.email)
        throw signUpResponse.data
    } else
      throw { data: signUpResponse.data, status: signUpResponse.status }

    //sign in with the email and password
    const signInResponse = await axios.post(`${coreurl}/auth/SignIn`, signUpPayload, { headers, validateStatus(status) { return true }, })
    let userToken = ""
    if (signInResponse.status == 200) {
      if (signInResponse.data.user.email != signUpPayload.email)
        throw signUpResponse.data
      //save tohe user token
      userToken = signInResponse.data.token
    } else
      throw { data: signInResponse.data, status: signInResponse.status }
    //set the user token in headers
    headers['user-token'] = userToken;
    //get user info
    const authResponse = await axios.get(`${coreurl}/auth`, { headers, validateStatus(status) { return true }, })
    if (authResponse.status == 200) {
      //validate status 200 and email match  
      if (authResponse.data.user.email != signUpPayload.email)
        throw authResponse.data
    } else
      throw { data: authResponse.data, status: authResponse.status }
    return server
  } catch (error) {
    console.error(error);
    server.close((err) => process.exit(1))
  }
}).then((server) => {
  server?.close((err) => process.exit(0))
})