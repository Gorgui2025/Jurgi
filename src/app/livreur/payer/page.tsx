import { prisma } from "@/lib/prisma";
import LivreurPaymentForm from "./LivreurPaymentForm";

export const dynamic = "force-dynamic";

export default async function LivreurPayerPage() {
  const plan = await prisma.plan.findUnique({
    where: { slug: "livreur", isVisible: true },
  });

  if (!plan) {
    return (
      <div className="page-container max-w-lg mx-auto py-16 px-4 text-center">
        <p className="text-charbon-300">Plan livreur non disponible.</p>
      </div>
    );
  }

  const configs = await prisma.siteConfig.findMany();
  const settings: Record<string, string> = {};
  for (const c of configs) {
    settings[c.key] = c.value;
  }

  const planData = {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    durationDays: plan.durationDays,
  };

  const paymentNumber = settings.payment_phone_number || "+221 77 981 95 88";
  const paymentMethods = settings.payment_methods || "Wave,Orange Money";

  return <LivreurPaymentForm plan={planData} paymentNumber={paymentNumber} paymentMethods={paymentMethods} />;
}
