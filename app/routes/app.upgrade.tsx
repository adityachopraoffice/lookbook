import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  await billing.require({
    plans: ["Pro Plan"],
    isTest: true,
    onFailure: async () => billing.request({ plan: "Pro Plan", isTest: true }),
  });
  return redirect("/app");
}
