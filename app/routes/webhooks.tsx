import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // The authenticate.webhook function automatically parses the incoming request,
  // verifies the Shopify HMAC signature, and returns the webhook payload.
  // If the signature is invalid, it throws a 401 Unauthorized response automatically.
  
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    
    // Log the webhook for debugging purposes
    console.log(`Received webhook: ${topic} for shop: ${shop}`);
    
    // For GDPR webhooks (CUSTOMERS_DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT)
    // you would normally process the payload here. For now, we simply acknowledge receipt.
    
    return new Response(null, { status: 200 });
  } catch (error) {
    // If authenticate.webhook throws (e.g. invalid signature), we still want to log it
    console.error("Webhook authentication failed:", error);
    // Return a 400 or let the thrown response pass through.
    // In Remix, thrown Responses are caught by the CatchBoundary, 
    // but here we can just throw it again so Remix handles it.
    throw error;
  }
};
