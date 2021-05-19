import { Stripe } from 'stripe';
import { NextApiResponse, NextApiRequest } from 'next';
import { Readable } from 'stream'
import { stripe } from '../../services/stripe';

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    );
  }

  return Buffer.concat(chunks)
}

export const config = {
  api : {
    bodyParser: false // desabilitar o entendimento padrão do next sobre o que está vindo da requisição 
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const buf = await buffer(req) // dentro do buf tenho a minha requisição em si 
    const secret = req.headers['stripe-signature']

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`WWebhook error ${err.message}`);
    }

    res.status(200).json({ ok: true})
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')
  }
}