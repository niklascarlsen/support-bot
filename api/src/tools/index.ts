import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {tool} from 'ai';
import {z} from 'zod';

const ordersPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../data/orders.json',
);

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

// Looks up an order from the local fake store (src/data/orders.json).
// The model has no order data unless it calls this tool.
//
// Both the order id and the email have to match. Both fields are required, so
// the model cannot even form a lookup on the id alone. The prompt asks for the
// two values one at a time, but that is only phrasing. This is the check.
export const getOrder = tool({
  description:
    'Fetch order details by order id and the email the order was placed with. Use this for any question about order status, tracking, items, or delivery. Both values must come from the user. Never invent order data.',
  inputSchema: z.object({
    // The example used to be PW-88421, which is a real order in the data.
    // The model treated it as a default and looked it up when the user gave
    // no id at all. Keep the example clearly fake.
    orderId: z
      .string()
      .describe(
        'Order id exactly as the user wrote it, in the form PW-00000. Ask the user for it instead of guessing.',
      ),
    email: z
      .email()
      .describe(
        'The email the order was placed with, exactly as the user wrote it. Ask the user for it. Never guess or invent an address.',
      ),
  }),
  execute: async ({orderId, email}) => {
    const orders = await loadOrders();
    const id = orderId.trim().toUpperCase();
    const mail = email.trim().toLowerCase();
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

export const tools = {
  getOrder,
};
