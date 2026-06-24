import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "react-router";
import { useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  List,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  
  const billingCheck = await billing.check({
    plans: ["Pro Plan"],
    isTest: true,
  });
  
  return { isPro: billingCheck.hasActivePayment };
}

export async function action({ request }: any) {
  const { billing } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "downgrade") {
    const billingCheck = await billing.check({
      plans: ["Pro Plan"],
      isTest: true,
    });
    const subscription = billingCheck.appSubscriptions?.[0];
    if (subscription) {
      await billing.cancel({
        subscriptionId: subscription.id,
        isTest: true,
        prorate: true,
      });
    }
    return null;
  }

  try {
    await billing.request({
      plan: "Pro Plan",
      isTest: true,
    });
  } catch (error: any) {
    if (error instanceof Response) {
      if (error.status === 401) {
        const url = error.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
        if (url) return { confirmationUrl: url };
      } else if (error.status === 302 || error.status === 301) {
        const url = error.headers.get("Location");
        if (url) return { confirmationUrl: url };
      }
    }
    // If it's not the expected response, or it's another error, rethrow it
    throw error;
  }
  
  return null;
}

export default function Pricing() {
  const { isPro } = useLoaderData<any>();
  const submit = useSubmit();
  const actionData = useActionData<any>();

  useEffect(() => {
    if (actionData?.confirmationUrl) {
      window.open(actionData.confirmationUrl, "_top");
    }
  }, [actionData]);

  const handleUpgrade = () => {
    submit({ intent: "upgrade" }, { method: "post" });
  };

  const handleDowngrade = () => {
    submit({ intent: "downgrade" }, { method: "post" });
  };

  const customStyles = `
    .pricing-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-top: 20px;
    }
    @media (min-width: 768px) {
      .pricing-container {
        flex-direction: row;
        align-items: stretch;
      }
    }
    .pricing-card {
      flex: 1;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
      position: relative;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .pricing-pro {
      border: 2px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #8b5cf6, #38bdf8) border-box;
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.15), 0 8px 10px -6px rgba(139, 92, 246, 0.1);
    }
    .pricing-pro::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.05), transparent 40%);
      border-radius: 14px;
      pointer-events: none;
    }
    .pricing-pro:hover {
      box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.2), 0 10px 10px -5px rgba(139, 92, 246, 0.1);
    }
    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(to right, #8b5cf6, #38bdf8);
      color: white;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
      white-space: nowrap;
    }
    .price-text {
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
      margin: 24px 0 8px 0;
      color: #0f172a;
    }
    .price-text span {
      font-size: 16px;
      font-weight: normal;
      color: #64748b;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 32px 0;
      flex-grow: 1;
    }
    .feature-list li {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      color: #334155;
      font-size: 15px;
      line-height: 1.5;
    }
    .feature-list li svg {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      margin-right: 12px;
      margin-top: 2px;
      color: #10b981;
    }
    .pricing-pro .feature-list li svg {
      color: #8b5cf6;
    }
    .btn-upgrade {
      background: linear-gradient(to right, #8b5cf6, #6366f1);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .btn-upgrade:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    }
    .btn-upgrade:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
    .btn-downgrade {
      background: white;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      text-align: center;
    }
    .btn-downgrade:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-downgrade:disabled {
      color: #94a3b8;
      border-color: #e2e8f0;
      background: #f8fafc;
      cursor: not-allowed;
    }
  `;

  const checkIcon = (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <Page title="Pricing">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Layout>
        <Layout.Section>
          <div className="pricing-container">
            {/* Free Plan */}
            <div className="pricing-card">
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Free Plan</Text>
                {!isPro && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <div className="price-text">$0<span>/month</span></div>
              <Text as="p" tone="subdued">Perfect for getting started with shoppable lookbooks.</Text>
              
              <ul className="feature-list">
                <li>{checkIcon} <span>Create 1 Lookbook</span></li>
                <li>{checkIcon} <span>Up to 5 hotspots total</span></li>
                <li>{checkIcon} <span>Grid and Hero Image layouts</span></li>
                <li>{checkIcon} <span>Basic storefront integration</span></li>
              </ul>

              <button className="btn-downgrade" disabled={!isPro} onClick={handleDowngrade}>
                {isPro ? "Downgrade to Free" : "Current Plan"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card pricing-pro">
              <div className="popular-badge">Recommended</div>
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Pro Plan</Text>
                {isPro && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <div className="price-text">$9.99<span>/month</span></div>
              <Text as="p" tone="subdued">For growing brands that need unlimited shoppable content.</Text>
              
              <ul className="feature-list">
                <li>{checkIcon} <span><strong>Unlimited</strong> Lookbooks</span></li>
                <li>{checkIcon} <span><strong>Unlimited</strong> hotspots</span></li>
                <li>{checkIcon} <span>Access to all 6 premium layouts (Masonry, Mosaic, Stack, etc.)</span></li>
                <li>{checkIcon} <span>Custom hotspot dot styling</span></li>
              </ul>

              <button className="btn-upgrade" disabled={isPro} onClick={handleUpgrade}>
                {isPro ? "Current Plan" : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
