import { config } from "../config";

import { Router } from "express";
import webpush from "web-push";
import getClientIp from "@supercharge/request-ip";

import { UserAuthService } from "./userAuth";
import { FileLogger } from "../utils/fileLogger";

import { NotificationEntity } from "../domain/entities";

const { webPush: { vapidKeys } } = config

var subscriptions: Record<string, Record<string, webpush.PushSubscription>> = {}
// VAPID keys should only be generated only once.
webpush.setVapidDetails(
    'mailto:' + vapidKeys.user,
    vapidKeys.publicKey,
    vapidKeys.privateKey,
);

const logger = new FileLogger("webpush")

export class WebPushService {
    static NotifyUser(user_id: any, notification: NotificationEntity, options?: webpush.RequestOptions) {
        const subs = subscriptions.User[user_id] ? Object.values(subscriptions.User[user_id]) : [];
        if (!subs || subs.length == 0) return
        const notificationPayload = {
            "notification": {
                "title": notification.message,
                "body": notification.message,
                "icon": "assets/main-page-logo-small-hat.png",
                "vibrate": [100, 50, 100],
                "data": {
                    "dateOfArrival": Date.now(),
                    "primaryKey": 1
                },
                "actions": [{
                    "action": "explore",
                    "title": "Go to the site"
                }]
            }
        };
        for (const subscription of subs) {
            webpush.sendNotification(subscription, JSON.stringify(notificationPayload), options)
                .then(sendResult => {
                    logger.log(`User[${user_id}] <-- (${sendResult.statusCode})`)
                })
                .catch(error => logger.error(error));
        }
    }
    static AddUserPushNotification(user_id: any, subscription: webpush.PushSubscription, ip: string) {
        subscriptions[user_id] = subscriptions[user_id] || {}
        subscriptions[user_id][ip] = subscription;
        logger.log(`Added Subscription User[${user_id}][${ip}] <-- ${subscription.endpoint}`)
    }
    static Init(router: Router) {
        router.post('/wp/Subscribe', async (req, res) => {
            try {
                const user = await UserAuthService.verifyToken(req)
                if (!user) throw { message: "SignUp Failed", status: 400 };
                const ip = getClientIp.getClientIp(req)
                const subscription = req.body
                WebPushService.AddUserPushNotification(user.id, subscription, ip || "0.0.0.0")
                res.status(201).json({});
            } catch (error) { console.error(error); res.status((error as any)?.status || 400).send(error) }
        });
    }
}
