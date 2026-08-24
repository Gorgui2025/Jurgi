import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PaymentForm from "./PaymentForm";

export const dynamic = "force-dynamic";

export default async function PaiementPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const planId = searchParams.plan;
  if (!planId) notFound();

  const plan = await prisma.plan.findUnique({
    where: { id: planId, isVisible: true },
  });

  if (!plan) notFound();

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
    maxActiveListings: plan.maxActiveListings,
  };

  const paymentNumber = settings.payment_phone_number || "+221 77 000 00 00";
  const paymentMethods = settings.payment_methods || "Wave,Orange Money";

  return <PaymentForm plan={planData} paymentNumber={paymentNumber} paymentMethods={paymentMethods} />;
}
