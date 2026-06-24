import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  await billing.require({
    plans: ["Pro Plan"],
    onFailure: async () => billing.request({ plan: "Pro Plan" }),
  });
  return redirect("/app");
}
