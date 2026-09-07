export default async (_request, context) => context.next();

export const config = {
  path: "/api/order",
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
