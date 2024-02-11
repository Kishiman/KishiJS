import { Dialect } from "sequelize/types";
require("dotenv").config();
require('console-stamp')(console, '[HH:MM:ss.l]');

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    console.error(new Error().stack);

  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });
export let config = {
  logPath: "logs",
  uploadPath: "uploads",
  auth: {
    signUpTypes: ["Client"] as string[],
    adminAddTypes: ["Client"] as string[],
    tokenSecret: process.env.AUTH_TOKEN_SECRET || "AUTH_Secret",
    resetPasswordTokenSecret: process.env.AUTH_RESET_PASSWORD_TOKEN_SECRET || "AUTH_Secret",
    passwordSecret: process.env.AUTH_PASSWORD_SECRET || "",
    lockIp: process.env.AUTH_lOCK_IP ? true : false,
    tokenExpiration: Number(process.env.AUTH_TOKEN_EXPIRATION) || undefined,
  },
  db: {
    name: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: (process.env.DB_DIALECT || "mysql") as Dialect,
    paranoid: false,
  },
  admin: {
    email: "kishi.admin@yopmail.com",
    password: "admin",
    username: "KishiAdmin",
    firstName: "Kishi",
    lastName: "Admin",
  },
  elasticsearch: {
    prefix: process.env.ES_PREFIX || "",
    hosts: (process.env.ES_HOST || "").split(":"),
  },
  redis: {
    url: process.env.REDIS_URL || "",
  },
  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.CONTRACTAI_MODEL ?? "gpt-4-1106-preview",
    maxPrompt: Number(process.env.CONTRACTAI_MAX_PROMPT ?? 128000),
  },
  zoom: {
    sdkKey: process.env.ZOOM_SDK_KEY || "",
    sdkSecret: process.env.ZOOM_SDK_SECRET || "",
    accountId: process.env.ZOOM_ACCOUNT_ID || "",
    clientId: process.env.ZOOM_CLIENT_ID || "",
    clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
  },
  firebase: {
    apiKey: process.env.FB_APIKEY,
    authDomain: process.env.FB_AUTHDOMAIN,
    projectId: process.env.FB_PROJECTID,
    storageBucket: process.env.FB_STORAGEBUCKET,
    messagingSenderId: process.env.FB_MESSAGINSENDERID,
    appId: process.env.FB_APPID,
  },
  dataleon: {
    apiKey: process.env.DATALEON_APIKEY || "",
    apiSecret: process.env.DATALEON_APISECRET || "",
  },
  googleMap: {
    API_KEY: process.env.GOOGLE_MAP_APIKEY || "",
  },
  yousign: {
    API_KEY: process.env.YOUSIGN_APIKEY || "",
  },

  stripe: {
    API_KEY: process.env.STRIPE_API_KEY || "",
    API_SECRET: process.env.STRIPE_SECRET || "",
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
    successUrl: "/register/post-payment",
    cancelUrl: "/logout",
  },
  S3: {
    REGION: process.env.AWS_S3_REGION || "",
    API_KEY: process.env.AWS_S3_APIKEY || "",
    API_SECRET: process.env.AWS_S3_APISECRET || "",
    BUCKET: process.env.AWS_S3_BUCKET || "",
    urlPrefix: "",
  },
  webPush: {
    vapidKeys: {
      user: process.env.WEBPUSH_USER || "",
      publicKey: process.env.WEBPUSH_PUBLICKEY || "",
      privateKey: process.env.WEBPUSH_PRIVATEKEY || "",
    },
  },
  mail: {
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: Number(process.env.SMTP_PORT) || 25,
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      ssl: process.env.SMTP_SSL ? true : false,
      tls: process.env.SMTP_TLS ? true : false,
    },
  },
  swan: {
    tokenRefresh: true,
    baseUrl: "https://api.swan.io/sandbox-partner",
    tokenEP: "https://oauth.swan.io/oauth2/token",
    authEP: "https://oauth.swan.io/oauth2/auth",
    client_id: process.env.SWAN_CLIENT_ID || "",
    client_secret: process.env.SWAN_CLIENT_SECRET || "",
    redirectUrlFront: "/login",
    redirectUrlBack: "/hooks/swan/log",
    redirectUri: {
      User: "/login",
      consent: "/mon-compte/landing-consent",
    },
    authExpireFirst: 3600,
    authExpire: 300,
    bearerTokenExpireMargin: 120,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    applicationSid: process.env.TWILIO_APPLICATION_SID || "",
    phoneNumber: process.env.TWILIO_VOICE_NUMBER || "",
    smsNumber: process.env.TWILIO_SMS_NUMBER || "",
    whatsAppNumber: `whatsapp:+${process.env.TWILIO_SMS_NUMBER || ""}`,
  },
  oneSignalKeys: [] as { appId: string, apiKey: string }[],
  idanalyzer: {
    apiKey: process.env.IDANALYZER_APIKEY || "",
  },
  server: {
    protocol: process.env.HTTPS ? "https://" : "http://" as "http://" | "https://",
    port: Number(process.env.SERVER_PORT) || 4000,
    publicUrl: process.env.PUBLIC_URL!,
  },
  domainName: "api.DOMAIN.com",
  register: [],
  frontEndName: process.env.CLIENT_NAME || "",
  frontEndUrl: process.env.CLIENT_URL || "",
  resetPasswordLandingPage: "/reset-password",
  token_ip: process.env.DEV_MODE ? false : true,
  token_expiresIn: 7 * 24 * 60 * 60,
};
config.S3.urlPrefix = `https://${config.S3.BUCKET}.s3.${config.S3.REGION}.amazonaws.com/`
