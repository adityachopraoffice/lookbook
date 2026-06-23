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

  return (
    <Page title="Pricing">
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card padding="500">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Free Plan</Text>
                {!isPro && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <Text variant="heading2xl" as="p">$0<Text variant="bodyMd" as="span" tone="subdued">/month</Text></Text>
              <Text as="p" tone="subdued">Perfect for getting started with shoppable lookbooks.</Text>
              
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <List>
                  <List.Item>Create 1 Lookbook</List.Item>
                  <List.Item>Up to 5 hotspots total</List.Item>
                  <List.Item>Grid layout</List.Item>
                  <List.Item>Basic storefront integration</List.Item>
                </List>
              </div>

              <Button disabled={!isPro} onClick={handleDowngrade}>
                {isPro ? "Downgrade" : "Current Plan"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card padding="500" background={isPro ? "bg-surface" : "bg-surface-secondary"}>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingLg" as="h2">Pro Plan</Text>
                {isPro && <Badge tone="success">Active</Badge>}
              </InlineStack>
              <Text variant="heading2xl" as="p">$9.99<Text variant="bodyMd" as="span" tone="subdued">/month</Text></Text>
              <Text as="p" tone="subdued">For growing brands that need unlimited shoppable content.</Text>
              
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <List>
                  <List.Item><strong>Unlimited</strong> Lookbooks</List.Item>
                  <List.Item><strong>Unlimited</strong> hotspots</List.Item>
                  <List.Item>Hero and Slideshow layouts</List.Item>
                  <List.Item>Custom hotspot dot styling</List.Item>
                </List>
              </div>

              <Button 
                variant="primary" 
                disabled={isPro} 
                onClick={handleUpgrade}
              >
                {isPro ? "Current Plan" : "Upgrade to Pro"}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
