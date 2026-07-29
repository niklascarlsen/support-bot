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

/**
 * Looks up an order from the local fake store (src/data/orders.json).
 * The model has no order data unless it calls this tool.
 */
export const getOrder = tool({
  description:
    'Fetch order details by order id from the order database. Use this for any question about order status, tracking, items, or delivery. Never invent order data.',
  inputSchema: z.object({
    orderId: z.string().describe('Order id, e.g. PW-88421'),
  }),
  execute: async ({orderId}) => {
    const orders = await loadOrders();
    const normalized = orderId.trim().toUpperCase();
    const order = orders.find((entry) => entry.id.toUpperCase() === normalized);

    if (!order) {
      return {
        found: false as const,
        orderId: normalized,
        message: 'No order found for that id.',
      };
    }

    return {
      found: true as const,
      order,
    };
  },
});

export const tools = {
  getOrder,
};
