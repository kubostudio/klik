import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const { plan, storeId, token } = await req.json();

    if (!plan || !["starter", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const customerId = await billingService.createCustomer(
      "vendedor@klik.sale",
      "Vendedor Klik",
    );
    const subscription = await billingService.createSubscription(
      customerId,
      plan,
      token || "tok_test",
    );

    return NextResponse.json({
      success: true,
      subscription,
      message: `Plan actualizado a ${plan.toUpperCase()}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error en billing" },
      { status: 500 },
    );
  }
}
