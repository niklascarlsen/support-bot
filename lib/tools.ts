import 'server-only';
import {tool} from 'ai';
import {z} from 'zod';
import ordersFile from '@/data/orders.json';
import faqFile from '@/data/faq.json';

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

const orders = ordersFile.orders as Order[];

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

// Both values required. A split check would tell a guesser which ids exist.
export const getOrder = tool({
  description:
    'Fetch order details by order id and the email the order was placed with. Use this for any question about order status, tracking, items, or delivery. Both values must come from the user. Never invent order data.',
  inputSchema: z.object({
    orderId: z
      .string()
      .describe(
        'Order id exactly as the user wrote it, six letters or digits. Ask the user for it instead of guessing.',
      ),
    email: z
      .string()
      .describe(
        'The email the order was placed with, exactly as the user wrote it. Ask the user for it. Never guess or invent an address.',
      ),
  }),
  execute: ({orderId, email}) => {
    const id = orderId.trim().toUpperCase();
    const mail = email.trim().toLowerCase();

    const order = orders.find(
      (entry) =>
        entry.id.toUpperCase() === id && entry.email.toLowerCase() === mail,
    );

    // Same miss for unknown id and wrong email.
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

const faqEntries = faqFile.entries as FaqEntry[];
const faqTopics = faqEntries.map((entry) => entry.topic).join(', ');

export const getFaq = tool({
  description: `The shop answers about ${faqTopics}. Call this whenever a customer asks how something works or reports a problem such as a damaged item. The answers are the same for every customer, so call it before asking for an order id or an email. Answer only with what it returns.`,
  inputSchema: z.object({}),
  execute: () => ({entries: faqEntries}),
});

// What this chat covers. The model has no other source for its own scope,
// same rule as every other fact about the shop.
export const getShopInfo = tool({
  description:
    'What this support chat can and cannot help with. Call this when the customer asks what you can do or who you are. Answer only with what it returns.',
  inputSchema: z.object({}),
  execute: () => ({
    covers: [
      'looking up an order, its status, carrier, tracking, items and delivery date, given the order id and the email the order was placed with',
      `the written shop answers about ${faqTopics}`,
    ],
    doesNotCover: [
      'placing, changing or cancelling an order',
      'anything that is not this shop',
    ],
  }),
});

export const tools = {
  getOrder,
  getFaq,
  getShopInfo,
};
