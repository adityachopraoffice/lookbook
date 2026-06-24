import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "react-router";
import { useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  
  const billingCheck = await billing.check({
    plans: ["Starter Plan", "Pro Plan"],
    isTest: true,
  });
  
  const subscriptions = billingCheck.appSubscriptions;
  const activePlan = subscriptions && subscriptions.length > 0 ? subscriptions[0].name : "Free Plan";
  
  return { activePlan };
}

export async function action({ request }: any) {
  const { billing } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "downgrade") {
    const billingCheck = await billing.check({
      plans: ["Starter Plan", "Pro Plan"],
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

  const targetPlan = intent === "upgrade_starter" ? "Starter Plan" : "Pro Plan";

  try {
    await billing.request({
      plan: targetPlan,
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
    throw error;
  }
  
  return null;
}

export default function Pricing() {
  const { activePlan } = useLoaderData<any>();
  const submit = useSubmit();
  const actionData = useActionData<any>();

  useEffect(() => {
    if (actionData?.confirmationUrl) {
      window.open(actionData.confirmationUrl, "_top");
    }
  }, [actionData]);

  const handleAction = (intent: string) => {
    submit({ intent }, { method: "post" });
  };

  const customStyles = `
    .pricing-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-top: 20px;
    }
    @media (min-width: 1024px) {
      .pricing-container {
        grid-template-columns: repeat(3, 1fr);
        align-items: stretch;
      }
    }
    .pricing-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
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
    .pricing-starter {
      border: 2px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #10b981, #3b82f6) border-box;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.15);
    }
    .pricing-starter .feature-list li svg { color: #10b981; }
    
    .pricing-pro {
      border: 2px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.2);
    }
    .pricing-pro .feature-list li svg { color: #8b5cf6; }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-starter { background: linear-gradient(to right, #10b981, #3b82f6); box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3); }
    .badge-pro { background: linear-gradient(to right, #8b5cf6, #ec4899); box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3); }

    .price-text {
      font-size: 40px;
      font-weight: 800;
      line-height: 1;
      margin: 20px 0 8px 0;
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
      margin: 24px 0;
      flex-grow: 1;
    }
    .feature-list li {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      color: #334155;
      font-size: 14px;
      line-height: 1.5;
    }
    .feature-list li svg {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      margin-right: 10px;
      margin-top: 2px;
      color: #64748b;
    }
    .btn-action {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      text-align: center;
      border: none;
    }
    .btn-downgrade {
      background: white;
      color: #334155;
      border: 1px solid #cbd5e1;
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
    
    .btn-starter {
      background: linear-gradient(to right, #10b981, #3b82f6);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .btn-pro {
      background: linear-gradient(to right, #8b5cf6, #ec4899);
      color: white;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
    
    .btn-starter:hover:not(:disabled), .btn-pro:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
    .btn-starter:disabled, .btn-pro:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
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
                <Text variant="headingLg" as="h2">Free</Text>
                {activePlan === "Free Plan" && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <div className="price-text">$0<span>/month</span></div>
              <Text as="p" tone="subdued">Perfect for getting started.</Text>
              
              <ul className="feature-list">
                <li>{checkIcon} <span>Create 1 Lookbook</span></li>
                <li>{checkIcon} <span>Up to 5 hotspots total</span></li>
                <li>{checkIcon} <span>Grid & Hero layouts</span></li>
                <li>{checkIcon} <span>Basic integration</span></li>
              </ul>

              <button className="btn-action btn-downgrade" disabled={activePlan === "Free Plan"} onClick={() => handleAction("downgrade")}>
                {activePlan === "Free Plan" ? "Current Plan" : "Downgrade to Free"}
              </button>
            </div>

            {/* Starter Plan */}
            <div className="pricing-card pricing-starter">
              <div className="popular-badge badge-starter">Great Value</div>
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Starter</Text>
                {activePlan === "Starter Plan" && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <div className="price-text">$39<span>/month</span></div>
              <Text as="p" tone="subdued">For small but growing brands.</Text>
              
              <ul className="feature-list">
                <li>{checkIcon} <span>Up to 5 Lookbooks</span></li>
                <li>{checkIcon} <span><strong>Unlimited</strong> hotspots</span></li>
                <li>{checkIcon} <span>Includes Masonry & Mosaic layouts</span></li>
                <li>{checkIcon} <span>Storefront Analytics</span></li>
              </ul>

              <button className="btn-action btn-starter" disabled={activePlan === "Starter Plan"} onClick={() => handleAction("upgrade_starter")}>
                {activePlan === "Starter Plan" ? "Current Plan" : "Upgrade to Starter"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card pricing-pro">
              <div className="popular-badge badge-pro">Best Experience</div>
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Pro</Text>
                {activePlan === "Pro Plan" && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <div className="price-text">$69<span>/month</span></div>
              <Text as="p" tone="subdued">Unlimited everything for pros.</Text>
              
              <ul className="feature-list">
                <li>{checkIcon} <span><strong>Unlimited</strong> Lookbooks</span></li>
                <li>{checkIcon} <span><strong>Unlimited</strong> hotspots</span></li>
                <li>{checkIcon} <span>All 6 premium layouts (Stack, Slideshow)</span></li>
                <li>{checkIcon} <span>Custom hotspot dot styling</span></li>
              </ul>

              <button className="btn-action btn-pro" disabled={activePlan === "Pro Plan"} onClick={() => handleAction("upgrade_pro")}>
                {activePlan === "Pro Plan" ? "Current Plan" : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
