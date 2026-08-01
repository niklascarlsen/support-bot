import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {tool} from 'ai';
import {z} from 'zod';

const dataDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../data',
);
const ordersPath = path.join(dataDir, 'orders.json');
const faqPath = path.join(dataDir, 'faq.json');

type Order = {
  id: string;
  customer: string;
  email: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  items: Array<{sku: string; name: string; qty: number}>;
  totalSek: number;
  placedAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
};

type OrdersFile = {
  orders: Order[];
};

async function loadOrders(): Promise<Order[]> {
  const raw = await readFile(ordersPath, 'utf8');
  const data = JSON.parse(raw) as OrdersFile;
  return data.orders;
}

function toPublicOrder(order: Order) {
  return {
    id: order.id,
    status: order.status,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    items: order.items.map((item) => ({name: item.name, qty: item.qty})),
    totalSek: order.totalSek,
    placedAt: order.placedAt,
    estimatedDelivery: order.estimatedDelivery,
    deliveredAt: order.deliveredAt,
  };
}

// Looks up an order from the local fake store. Both values are required, a
// split check would tell a guesser which order ids exist.
export const getOrder = tool({
  description:
    'Fetch order details by order id and the email the order was placed with. Use this for any question about order status, tracking, items, or delivery. Both values must come from the user. Never invent order data.',
  inputSchema: z.object({
    // No example id here, the model took the last one as a default.
    orderId: z
      .string()
      .describe(
        'Order id exactly as the user wrote it, six letters or digits. Ask the user for it instead of guessing.',
      ),
    // A plain string, not z.email(). A schema miss ends the turn with a
    // generic error, a wrong address just misses like anything else.
    email: z
      .string()
      .describe(
        'The email the order was placed with, exactly as the user wrote it. Ask the user for it. Never guess or invent an address.',
      ),
  }),
  execute: async ({orderId, email}) => {
    const id = orderId.trim().toUpperCase();
    const mail = email.trim().toLowerCase();

    const orders = await loadOrders();
    const order = orders.find(
      (entry) =>
        entry.id.toUpperCase() === id && entry.email.toLowerCase() === mail,
    );

    // An unknown id and a real id with the wrong email give the same answer.
    // Anything else tells a guesser which order ids exist.
    if (!order) {
      return {
        found: false as const,
        orderId: id,
        message: 'No order matches that order id and email.',
      };
    }

    return {
      found: true as const,
      order: toPublicOrder(order),
    };
  },
});

type FaqEntry = {topic: string; question: string; answer: string};

type FaqFile = {
  entries: FaqEntry[];
};

const faq = JSON.parse(await readFile(faqPath, 'utf8')) as FaqFile;
const faqTopics = faq.entries.map((entry) => entry.topic).join(', ');

export const getFaq = tool({
  description: `The shop answers about ${faqTopics}. Call this whenever a customer asks how something works or reports a problem such as a damaged item. The answers are the same for every customer, so call it before asking for an order id or an email. Answer only with what it returns.`,
  inputSchema: z.object({}),
  execute: () => ({entries: faq.entries}),
});

export const tools = {
  getOrder,
  getFaq,
};
