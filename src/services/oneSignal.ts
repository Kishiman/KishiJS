import { config } from '../config'

import https from 'https'
import OneSignal from 'onesignal-node'

import { KArray } from '../utils/array'

const { oneSignalKeys } = config

let clients: OneSignal.Client[] = []
for (const oneSignalKey of oneSignalKeys) {
    var client = new OneSignal.Client(oneSignalKey.appId, oneSignalKey.apiKey);
    clients.push(client)
}

class OneSignalLib {
    static async getViewDevices() {
        var devices = []
        for (const client of clients) {
            const _devices = await client.viewDevices()
            devices.push(..._devices.body.players)
        }
        return devices
    }
    static sendNotification(data: any) {
        for (const oneSignalKey of oneSignalKeys) {
            data.app_id = oneSignalKey.appId
            var headers = {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Basic " + oneSignalKey.apiKey
            };

            var options = {
                host: "onesignal.com",
                port: 443,
                path: "/api/v1/notifications",
                method: "POST",
                headers: headers
            };

            var req = https.request(options, function (res) {
                res.on('data', function (data) {
                    console.log("Response:", JSON.parse(data));
                });
            });

            req.on('error', function (e) {
                console.log("ERROR:", e);
            });

            req.write(JSON.stringify(data));
            req.end();
        }
    };

    static notifyUser2(user_id: any, notification: any) {
        var message = {
            contents: { "fr": notification },
            channel_for_external_user_ids: "push",
            include_external_user_ids: [user_id]
        }
        this.sendNotification(message);
    }
    static notifyUser(user_id: any, notif: any) {
        const notification = {
            contents: { 'en': notif.message },
            data: notif,
            //android_channel_id: "d503a099-8dfc-4a9e-be4b-9f77804eb61e",
            android_sound: "sonnerie",
            include_external_user_ids: ["" + user_id]
        };
        OneSignalLib.getViewDevices().then(currentDevices => {
            const external_users_id = KArray.get(currentDevices, "external_user_id").filter(id => id)
            console.log("external_users_id", external_users_id);
        }).catch(error => console.error(error))
        for (const client of clients) {
            client.createNotification(notification)
                .then(response => {
                    if (response && response.body)
                        console.log("response.body", response.body);
                })
                .catch(e => {
                    if (e) {
                        console.warn("notification", notification);
                        console.error("OneSignalLib.notifyUser :", e);
                    }
                });
        }
    }

}
module.exports = OneSignalLib