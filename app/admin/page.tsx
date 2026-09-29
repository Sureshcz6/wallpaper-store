import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    todaySales,
    totalSales,
    totalOrders,
    productsSold,
    pendingDeliveries,
    successfulPayments,
    failedPayments,
    products,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startOfToday },
      },
    }),

    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        paymentStatus: "PAID",
      },
    }),

    prisma.order.count(),

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

    prisma.order.count({
      where: {
        deliveryStatus: "PENDING",
      },
    }),

    prisma.order.count({
      where: {
        paymentStatus: "PAID",
      },
    }),

    prisma.order.count({
      where: {
        paymentStatus: "FAILED",
      },
    }),

    prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const cards = [
    {
      label: "Today's sales",
      value: formatINR(todaySales._sum.amount ?? 0),
    },
    {
      label: "Total sales",
      value: formatINR(totalSales._sum.amount ?? 0),
    },
    {
      label: "Total orders",
      value: totalOrders.toString(),
    },
    {
      label: "Products sold",
      value: productsSold.toString(),
    },
    {
      label: "Pending deliveries",
      value: pendingDeliveries.toString(),
    },
    {
      label: "Successful payments",
      value: successfulPayments.toString(),
    },
    {
      label: "Failed payments",
      value: failedPayments.toString(),
    },
  ];

  const hasData = totalOrders > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-muted">
          Overview of your digital products and orders.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted">
              {card.label}
            </p>

            <p className="mt-1 text-xl font-semibold text-ink">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Products */}
      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Products
            </h2>

            <p className="mt-1 text-sm text-muted">
              Latest products added to your store.
            </p>
          </div>

          <a
            href="/admin/products"
            className="text-sm font-medium text-ink underline underline-offset-4"
          >
            View all
          </a>
        </div>

        {products.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-medium text-ink">
              No products found.
            </p>

            <p className="mt-1 text-sm text-muted">
              Add your first digital product to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Selling price
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Original price
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-b-0 hover:bg-background"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-ink">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          /{product.slug}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-ink">
                      {formatINR(product.price)}
                    </td>

                    <td className="px-5 py-4 text-muted">
                      {product.originalPrice
                        ? formatINR(product.originalPrice)
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : product.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-muted">
                      {product.createdAt.toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!hasData && (
        <p className="text-sm text-muted">
          No sales data yet.
        </p>
      )}
    </div>
  );
}