import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { name: true } } }
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="py-2 font-normal">Order ID</th>
                <th className="py-2 font-normal">Customer</th>
                <th className="py-2 font-normal">Product</th>
                <th className="py-2 font-normal">Amount</th>
                <th className="py-2 font-normal">Payment</th>
                <th className="py-2 font-normal">Delivery</th>
                <th className="py-2 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-3 text-ink">{o.orderNumber}</td>
                  <td className="py-3 text-muted">{o.customerName}<br /><span className="text-xs">{o.customerEmail}</span></td>
                  <td className="py-3 text-muted">{o.product.name}</td>
                  <td className="py-3 text-muted">{formatINR(o.amount)}</td>
                  <td className="py-3 text-muted">{o.paymentStatus}</td>
                  <td className="py-3 text-muted">{o.deliveryStatus}</td>
                  <td className="py-3 text-muted">{o.createdAt.toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
