import { fauna } from './../../services/fauna';
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { query as q } from 'faunadb'
import { stripe } from "../../services/stripe";

type User = {
  ref: {
    id: string
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // só quero aceitar req do tipo POST pq eu estou criando uma checkout session do stripe
  if (req.method === "POST") {
    // quando o usuário criar na intenção de compra eu vou criar um customer pra ele dentro do painel do stripe
    const session = await getSession();

    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )


    const stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      // metadata
    });

    // evitar duplicação de usuário
    await fauna.query(
      q.Update(
        q.Ref(q.Collection('users'), user.ref.id),
        {
          data: {
            stripe_customer_id: stripeCustomer.id
          }
        }
      )
    )

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id, // id do customer no stripe
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: "price_1IosmKLLdbGaRW1OFPRHNtA2", // price id
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true, // posso criar cupom de desconto
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_UR,
    });
    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
