import { config } from "../config";

import { Twilio, jwt, twiml } from "twilio";
import { Router } from "express";
import { ServiceInstance } from "twilio/lib/rest/verify/v2/service";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

import { FileLogger } from "../utils/fileLogger";
import { KishiModel } from "../sequelize";

const { server: { publicUrl } } = config;
const { accountSid, authToken, applicationSid, phoneNumber, smsNumber, whatsAppNumber } = config.twilio;

const logger = new FileLogger("twilio")
let client: Twilio
let service: ServiceInstance

export class TwilioService {
    static async Init(models: { [name: string]: typeof KishiModel }, router: Router) {
        client = new Twilio(accountSid, authToken);
        service = await client.verify.services.create({ friendlyName: 'My Verify Service' })
    }
    static GetCapabilityToken() {
        const capability = new jwt.ClientCapability({
            accountSid: accountSid,
            authToken: authToken
        });
        capability.addScope(
            new jwt.ClientCapability.OutgoingClientScope({
                applicationSid: applicationSid
            })
        );
        // logger.log("capability", capability);
        const token = capability.toJwt();
        return token
    }
    static CallSendTwiml(callSid: string, params: Record<string, string>) {
        const call = client.calls.get(callSid)
        const voiceResponse = new twiml.VoiceResponse()
        const dial = voiceResponse.dial()
        const cl = dial.client(callSid)
        for (const key in params) {
            cl.parameter({
                name: key,
                value: params[key]
            })
        }
        logger.log("twiml :", voiceResponse.toString());
        if (call) {
            call.update({ twiml: voiceResponse.toString() })
        }
    }
    static HangUpCall(callSid: string) {
        const call = client.calls.get(callSid)
        if (call) {
            call.update({
                status: "completed"
            }, (err, item) => {
                if (err) {
                    logger.warn("call.update failed :", callSid);
                    logger.warn(err);
                    call.remove((err, item) => {
                        if (err) {
                            logger.error(`:[${callSid}]${JSON.stringify(err, null, "\t")}`)
                        }
                    })
                }
            })
        }
    }
    static CreatePlayResponse(url: string): VoiceResponse {
        const voiceResponse = new twiml.VoiceResponse();
        voiceResponse.play(url)
        return voiceResponse
    }
    static CreateVoiceResponse(toNumber: string, options: any = {}): VoiceResponse {
        const voiceResponse = new twiml.VoiceResponse();
        voiceResponse.dial({
            callerId: phoneNumber,
            record: 'record-from-answer-dual',
            recordingStatusCallback: `${publicUrl}/hooks/twilio/recordingStatusCallback`,
            recordingStatusCallbackMethod: "POST",
            recordingStatusCallbackEvent: "in-progress",
            ...(options || {}),
        }, toNumber)
        return voiceResponse
    }
    static CreateConferenceVoiceResponse(friendlyName: string, options: any = {}): VoiceResponse {
        const voiceResponse = new twiml.VoiceResponse();
        const dial = voiceResponse.dial()
        dial.conference({
            conferenceStatusCallbackEvent: ['start', 'end', 'join', 'leave'],
            conferenceStatusCallback: `${publicUrl}/hooks/twilio/conferenceStatusCallback`,
            record: false,
            // recordingStatusCallback: IPLib.domainIPAddress + "/hook/Twilio/recordingStatusCallback",
            // recordingStatusCallbackMethod: "POST",
            waitMethod: "GET",
            waitUrl: "https://media-sound.s3.eu-west-3.amazonaws.com/export_ofoct.com.mp3",
            ...(options || {}),
        }, friendlyName)
        return voiceResponse
    }

    static async CreateConference(userId: any, toNumber: string, friendlyName: string, options: any = {}) {
        const conference = client.conferences(friendlyName)
        return new Promise(async (resolve, reject) => {
            const attributes = {
                to: toNumber,   //number which i want to add to conference
                from: phoneNumber, //number I bought from Twilio

                method: 'POST',
                conferenceStatusCallbackEvent: ['start', 'end', 'join', 'leave'],
                conferenceStatusCallback: `${publicUrl}/hooks/twilio/conferenceStatusCallback`,
                endConferenceOnExit: true,

                statusCallbackMethod: 'POST',
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallback: `${publicUrl}/hooks/twilio/callStatusCallback`,

                record: true,
                recordingStatusCallbackMethod: "POST",
                recordingStatusCallback: `${publicUrl}/hooks/twilio/recordingStatusCallback`,

                waitMethod: "GET",
                waitUrl: "https://media-sound.s3.eu-west-3.amazonaws.com/export_ofoct.com.mp3",

                beep: false,
                userId,
                timeout: '20',
                ...options,
            }
            await conference.participants.create(attributes, function (err, participant) {
                if (err) {
                    logger.error(`:[${friendlyName}] ${JSON.stringify(err, null, "\t")}`)
                    return reject(err)
                }
                return resolve(participant)

            })
        })
    }
    static async GetConferenceParticipantsSid(conferenceSid: string) {
        return new Promise(async (resolve, reject) => {
            var out = []
            var participants = await client.conferences(conferenceSid)
                .participants.list()
            for (const participant of participants) {
                out.push(participant.callSid)
            }
            return resolve(out)
        })
    }
    static JoinConference(conferenceName: string, options = {}): VoiceResponse {
        options = {
            record: false,
            // recordingStatusCallback: IPLib.domainIPAddress + "/hook/Twilio/recordingStatusCallback",
            // recordingStatusCallbackMethod: "POST",
            waitMethod: "GET",
            waitUrl: "https://media-sound.s3.eu-west-3.amazonaws.com/export_ofoct.com.mp3",
            ...options,
        }
        const voiceResponse = new twiml.VoiceResponse();
        voiceResponse.dial().conference(options, conferenceName)
        return voiceResponse
    }

    static async UpdateConference(conferenceSid: string, conferenceData: any = {}) {
        for (const sid in conferenceData) {
            try {
                const participantoptions = conferenceData[sid]
                await client.conferences(conferenceSid)
                    .participants(sid).update(participantoptions, (err, items) => {
                        if (err) return logger.error(err)
                        logger.log("participant updated :", sid);
                        logger.log("items", items);
                    })
                if (participantoptions.leave) {
                    await client.conferences(conferenceSid)
                        .participants(sid).remove((err, items) => {
                            if (err) return logger.error(err)
                            logger.log("participant left :", sid);
                        })
                }
            } catch (error) {
                logger.error(error)
            }
        }
    }

    static async GetTwilioPhoneNumbers() {
        return new Promise(async (resolve, reject) => {
            const incomingPhoneNumbers = await client.incomingPhoneNumbers.list()
            return resolve(incomingPhoneNumbers)
        })
    }


    static SendWhatsApp(number: string, message: string) {
        return new Promise(async (resolve, reject) => {
            const whatsApp = await client.messages.create({
                body: message,
                from: whatsAppNumber,
                to: "whatsapp:" + number,
            }).catch(err => {
                return logger.error(err)
            })
            return resolve(whatsApp);
        })
    }

    static SendSMS(number: string, message: string) {
        return new Promise(async (resolve, reject) => {
            const sms = await client.messages.create({
                body: message,
                from: smsNumber,
                to: number,
            }).catch(err => {
                return logger.error(err)
            })
            return resolve(sms);

        })
    }
    static async sendCheckCode(phone: string) {
        service.verifications().create({ to: phone, channel: 'sms' })
            .then(verification => logger.warn(verification.status));
    }
    static verifyCode(phone: string, code: string) {
        return new Promise(async (resolve, reject) => {
            service.verificationChecks().create({ to: phone, code })
                .then(verification_check => resolve(verification_check.status));
        })
    }
}