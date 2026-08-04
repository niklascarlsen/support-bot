// Order rows from orders.json by role, so cases never hardcode an id.
import ordersFile from '@/data/orders.json';

function orderWith(status: string) {
  const order = ordersFile.orders.find((entry) => entry.status === status);

  if (!order) {
    throw new Error(
      `data/orders.json has no ${status} order, the eval cases need one`,
    );
  }

  return order;
}

function unusedOrderId(candidate: string) {
  if (ordersFile.orders.some((entry) => entry.id === candidate)) {
    throw new Error(`${candidate} is a real order id, the miss cases need one`);
  }

  return candidate;
}

export const shipped = orderWith('shipped');
export const processing = orderWith('processing');
export const delivered = orderWith('delivered');

export const unknownOrderId = unusedOrderId('ZZZZZZ');
