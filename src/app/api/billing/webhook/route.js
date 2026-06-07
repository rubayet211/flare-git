import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function stripeTimestampToDate(timestamp) {
  return timestamp ? new Date(timestamp * 1000) : new Date();
}

function getSubscriptionPriceId(subscription) {
  return subscription.items?.data?.[0]?.price?.id || null;
}

async function getSubscriptionFromEvent(stripe, subscription) {
  if (!subscription) return null;
  if (typeof subscription === "string") {
    return stripe.subscriptions.retrieve(subscription);
  }
  return subscription;
}

async function findUserIdForSubscription(subscription) {
  const userId = subscription.metadata?.userId;
  if (userId) return userId;

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  return existing?.userId || null;
}

async function syncSubscription(subscription, userId) {
  const status = subscription.status || "incomplete";
  const isPaidPlan = ["active", "trialing", "past_due"].includes(status);
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId,
      stripePriceId: getSubscriptionPriceId(subscription),
      stripeSubscriptionId: subscription.id,
      status,
      plan: isPaidPlan ? "pro" : "free",
      currentPeriodStart: stripeTimestampToDate(
        subscription.current_period_start
      ),
      currentPeriodEnd: stripeTimestampToDate(subscription.current_period_end),
    },
    update: {
      stripeCustomerId,
      stripePriceId: getSubscriptionPriceId(subscription),
      stripeSubscriptionId: subscription.id,
      status,
      plan: isPaidPlan ? "pro" : "free",
      currentPeriodStart: stripeTimestampToDate(
        subscription.current_period_start
      ),
      currentPeriodEnd: stripeTimestampToDate(subscription.current_period_end),
    },
  });
}

async function handleCheckoutSessionCompleted(stripe, session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId) return;

  const subscription = await getSubscriptionFromEvent(
    stripe,
    session.subscription
  );
  if (!subscription) return;

  await syncSubscription(subscription, userId);
}

async function handleInvoicePaymentSucceeded(stripe, invoice) {
  const subscription = await getSubscriptionFromEvent(
    stripe,
    invoice.subscription
  );
  if (!subscription) return;

  const userId = await findUserIdForSubscription(subscription);
  if (!userId) return;

  await syncSubscription(subscription, userId);
}

async function handleSubscriptionDeleted(subscription) {
  const userId = await findUserIdForSubscription(subscription);
  if (!userId) return;

  await syncSubscription(subscription, userId);
}

export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
    });
  }

  let event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return new NextResponse(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(stripe, event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(stripe, event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to handle webhook" }),
      { status: 500 }
    );
  }
}
