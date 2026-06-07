import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return new NextResponse(
        JSON.stringify({ error: "STRIPE_PRICE_ID_PRO is not configured" }),
        { status: 500 }
      );
    }

    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const checkoutParams = {
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?billing=success`,
      cancel_url: `${origin}/dashboard?billing=cancelled`,
      client_reference_id: session.user.id,
      metadata: {
        userId: session.user.id,
        plan: "pro",
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan: "pro",
        },
      },
    };

    if (existingSubscription?.stripeCustomerId) {
      checkoutParams.customer = existingSubscription.stripeCustomerId;
    } else if (session.user.email) {
      checkoutParams.customer_email = session.user.email;
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create(
      checkoutParams
    );

    return NextResponse.json({
      id: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create checkout session" }),
      { status: 500 }
    );
  }
}
