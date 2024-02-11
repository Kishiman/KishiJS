import { config } from "../config";

import Stripe from "stripe";
import { defaults } from "lodash";
import { Router } from "express";
import axios from 'axios'

import { KishiModel } from "../sequelize";
import { FileLogger } from "../utils/fileLogger";

const { stripe: { API_KEY, API_SECRET, WEBHOOK_SECRET, successUrl, cancelUrl } } = config

const logger = new FileLogger("stripe")
const { frontEndUrl } = config
type EventType =
  | 'account.updated'
  | 'account.external_account.created'
  | 'account.external_account.deleted'
  | 'account.external_account.updated'
  | 'balance.available'
  | 'billing_portal.configuration.created'
  | 'billing_portal.configuration.updated'
  | 'billing_portal.session.created'
  | 'capability.updated'
  | 'cash_balance.funds_available'
  | 'charge.captured'
  | 'charge.expired'
  | 'charge.failed'
  | 'charge.pending'
  | 'charge.refunded'
  | 'charge.succeeded'
  | 'charge.updated'
  | 'charge.dispute.closed'
  | 'charge.dispute.created'
  | 'charge.dispute.funds_reinstated'
  | 'charge.dispute.funds_withdrawn'
  | 'charge.dispute.updated'
  | 'charge.refund.updated'
  | 'checkout.session.async_payment_failed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'coupon.created'
  | 'coupon.deleted'
  | 'coupon.updated'
  | 'credit_note.created'
  | 'credit_note.updated'
  | 'credit_note.voided'
  | 'customer.created'
  | 'customer.deleted'
  | 'customer.updated'
  | 'customer.discount.created'
  | 'customer.discount.deleted'
  | 'customer.discount.updated'
  | 'customer.source.created'
  | 'customer.source.deleted'
  | 'customer.source.expiring'
  | 'customer.source.updated'
  | 'customer.subscription.created'
  | 'customer.subscription.deleted'
  | 'customer.subscription.pending_update_applied'
  | 'customer.subscription.pending_update_expired'
  | 'customer.subscription.trial_will_end'
  | 'customer.subscription.updated'
  | 'customer.tax_id.created'
  | 'customer.tax_id.deleted'
  | 'customer.tax_id.updated'
  | 'customer_cash_balance_transaction.created'
  | 'file.created'
  | 'financial_connections.account.created'
  | 'financial_connections.account.deactivated'
  | 'financial_connections.account.disconnected'
  | 'financial_connections.account.reactivated'
  | 'financial_connections.account.refreshed_balance'
  | 'identity.verification_session.canceled'
  | 'identity.verification_session.created'
  | 'identity.verification_session.processing'
  | 'identity.verification_session.requires_input'
  | 'identity.verification_session.verified'
  | 'invoice.created'
  | 'invoice.deleted'
  | 'invoice.finalization_failed'
  | 'invoice.finalized'
  | 'invoice.marked_uncollectible'
  | 'invoice.paid'
  | 'invoice.payment_action_required'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'invoice.sent'
  | 'invoice.upcoming'
  | 'invoice.updated'
  | 'invoice.voided'
  | 'invoiceitem.created'
  | 'invoiceitem.deleted'
  | 'invoiceitem.updated'
  | 'issuing_authorization.created'
  | 'issuing_authorization.updated'
  | 'issuing_card.created'
  | 'issuing_card.updated'
  | 'issuing_cardholder.created'
  | 'issuing_cardholder.updated'
  | 'issuing_dispute.closed'
  | 'issuing_dispute.created'
  | 'issuing_dispute.funds_reinstated'
  | 'issuing_dispute.submitted'
  | 'issuing_dispute.updated'
  | 'issuing_transaction.created'
  | 'issuing_transaction.updated'
  | 'mandate.updated'
  | 'order.created'
  | 'payment_intent.amount_capturable_updated'
  | 'payment_intent.canceled'
  | 'payment_intent.created'
  | 'payment_intent.partially_funded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.processing'
  | 'payment_intent.requires_action'
  | 'payment_intent.succeeded'
  | 'payment_link.created'
  | 'payment_link.updated'
  | 'payment_method.attached'
  | 'payment_method.automatically_updated'
  | 'payment_method.detached'
  | 'payment_method.updated'
  | 'payout.canceled'
  | 'payout.created'
  | 'payout.failed'
  | 'payout.paid'
  | 'payout.updated'
  | 'person.created'
  | 'person.deleted'
  | 'person.updated'
  | 'plan.created'
  | 'plan.deleted'
  | 'plan.updated'
  | 'price.created'
  | 'price.deleted'
  | 'price.updated'
  | 'product.created'
  | 'product.deleted'
  | 'product.updated'
  | 'promotion_code.created'
  | 'promotion_code.updated'
  | 'quote.accepted'
  | 'quote.canceled'
  | 'quote.created'
  | 'quote.finalized'
  | 'radar.early_fraud_warning.created'
  | 'radar.early_fraud_warning.updated'
  | 'recipient.created'
  | 'recipient.deleted'
  | 'recipient.updated'
  | 'reporting.report_run.failed'
  | 'reporting.report_run.succeeded'
  | 'review.closed'
  | 'review.opened'
  | 'setup_intent.canceled'
  | 'setup_intent.created'
  | 'setup_intent.requires_action'
  | 'setup_intent.setup_failed'
  | 'setup_intent.succeeded'
  | 'sigma.scheduled_query_run.created'
  | 'sku.created'
  | 'sku.deleted'
  | 'sku.updated'
  | 'source.canceled'
  | 'source.chargeable'
  | 'source.failed'
  | 'source.mandate_notification'
  | 'source.refund_attributes_required'
  | 'source.transaction.created'
  | 'source.transaction.updated'
  | 'subscription_schedule.aborted'
  | 'subscription_schedule.canceled'
  | 'subscription_schedule.completed'
  | 'subscription_schedule.created'
  | 'subscription_schedule.expiring'
  | 'subscription_schedule.released'
  | 'subscription_schedule.updated'
  | 'tax_rate.created'
  | 'tax_rate.updated'
  | 'terminal.reader.action_failed'
  | 'terminal.reader.action_succeeded'
  | 'test_helpers.test_clock.advancing'
  | 'test_helpers.test_clock.created'
  | 'test_helpers.test_clock.deleted'
  | 'test_helpers.test_clock.internal_failure'
  | 'test_helpers.test_clock.ready'
  | 'topup.canceled'
  | 'topup.created'
  | 'topup.failed'
  | 'topup.reversed'
  | 'topup.succeeded'
  | 'transfer.created'
  | 'transfer.reversed'
  | 'transfer.updated'
type EventTarget =
  'account'
  | 'billing_portal'
  | 'capability'
  | 'cash_balance'
  | 'charge'
  | 'checkout'
  | 'coupon'
  | 'credit_note'
  | 'customer'
  | 'customer_cash_balance_transaction'
  | 'file'
  | 'financial_connections'
  | 'identity'
  | 'invoice'
  | 'invoiceitem'
  | 'issuing_authorization'
  | 'issuing_card'
  | 'issuing_cardholder'
  | 'issuing_dispute'
  | 'issuing_transaction'
  | 'mandate'
  | 'order'
  | 'payment_intent'
  | 'payment_link'
  | 'payment_method'
  | 'payout'
  | 'person'
  | 'plan'
  | 'price'
  | 'product'
  | 'promotion_code'
  | 'quote'
  | 'radar'
  | 'recipient'
  | 'reporting'
  | 'review'
  | 'setup_intent'
  | 'sigma'
  | 'sku'
  | 'source'
  | 'subscription_schedule'
  | 'tax_rate'
  | 'terminal'
  | 'test_helpers'
  | 'topup'
  | 'transfer'
//WIP


const client = new Stripe(API_KEY, { apiVersion: "2020-08-27" });
export type StripeHooks = {
  [key in EventTarget]?: (eventType: EventType, event: Stripe.Event) => void
}
export interface StripeListener {
  stripeHooks: StripeHooks
}

export class StripeService {
  static get stripe() {
    return client
  }
  static async GetPrice(id: string) {
    try {
      const price = await this.stripe.prices.retrieve(id);
      return price
    } catch (error) {
      logger.error(error);
      throw `Stripe could not be retreived`
    }
  }
  static async CreateCharge(amount: number, currency: string, tokenId: string, description = "") {
    return await this.stripe.charges.create({
      amount,
      currency,
      description,
      source: tokenId
    })
  }
  static async CreateSession(sessionParams: Stripe.Checkout.SessionCreateParams, urlParams: any,) {
    try {
      var success_url = new URL(`${frontEndUrl}${successUrl}`)
      for (const key in urlParams)
        success_url.searchParams.append(key, urlParams[key])
      success_url.searchParams.append("session_id", "{CHECKOUT_SESSION_ID}")
      defaults(sessionParams, {
        allow_promotion_codes: true,
        success_url: success_url.href,
        cancel_url: `${frontEndUrl}${cancelUrl}?session_id={CHECKOUT_SESSION_ID}`,
      })
      const session = await this.stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      logger.error(error)
      throw error
    }
  }
  static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
    router.post('/hooks/stripe', async (req, res) => {
      const sig = req.headers['stripe-signature'];
      try {
        if (!sig) {
          throw `No Signature provided`
        }
        const body = req.body
        const event = this.stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
        const eventType = event.type as EventType;
        const target = eventType.split(".")[0] as EventTarget
        for (const modelName in models) {
          const Model = models[modelName]
          const stripeHooks = (Model as any as StripeListener)?.stripeHooks
          if (!stripeHooks?.[target])
            continue
          logger.log(`${Model.name}.stripeHooks["${target}"]()`);
          try {
            stripeHooks[target]?.(eventType, event)
          } catch (error) {
            logger.error(error)
          }
        }
        return res.send({ message: "ok" });
      } catch (error) {
        logger.error(error)
        return res.status(400).send({ error: (error as any).message || error });
      }
    });
    router.get('/stipe/generateToken', async function (req, res, next) {
      try {
        const headers = {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "*/*",
          'User-Agent': 'ANYTHING_WILL_WORK_HERE',
          'Authorization': 'Bearer ' + API_KEY
        }
        const tokenResponse = await axios.post(
          "https://api.stripe.com/v1/tokens",
          new URLSearchParams({
            "card[number]": "4242424242424242",
            "card[exp_month]": "12",
            "card[exp_year]": "2023",
            "card[cvc]": "123",
          }).toString(),
          { headers })
        return res.status(200).send({
          token: tokenResponse.data,
        })
      } catch (error) {
        logger.error(error)
        return res.status(400).send({ error: (error as any).message || error });
      }
    })
  }
}
