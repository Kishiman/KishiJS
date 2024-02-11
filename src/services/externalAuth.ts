import { config } from "../config";
import jwt from "jsonwebtoken"

import axios from "axios";
const { auth: { } } = config;


export type ExternalTokenType = "Google" | "LinkedIn"
type GoogleResponse = {
	"azp": "YOUR_CLIENT_ID.apps.googleusercontent.com",
	"aud": "YOUR_CLIENT_ID.apps.googleusercontent.com",
	"sub": number,
	"email": string,
	"email_verified": boolean,
	"at_hash": string,
	"iss": "https://accounts.google.com",
	"iat": number,
	"exp": number
}
type LinkedInResponse = {
	"localizedFirstName": string,
	"localizedLastName": string,
	"id": string,
	"emailAddress": string,
	"profilePicture": {
		"displayImage": string
	}
}
interface TokenVerification {
	"email": string,
	"emailVerified"?: boolean,
	"expiresAt"?: Date,
}
export class ExternalAuthService {
	static async VerifyExternalToken(accessToken: string, type: ExternalTokenType): Promise<TokenVerification | null> {
		let response
		switch (type) {
			case 'Google':
				response = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { 'access_token': `${accessToken}` } })
				return {
					email: response.data.email,
					expiresAt: new Date(response.data.exp),
				}
			case 'LinkedIn':
				response = await axios.get('https://api.linkedin.com/v2/me', { headers: { 'Authorization': `Bearer ${accessToken}` } })
				const linkedInData = response.data as LinkedInResponse
				return {
					email: linkedInData.emailAddress,
				}
			default:
				break;
		}
		return null

	}
}
