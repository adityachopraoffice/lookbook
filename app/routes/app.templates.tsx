import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "react-router";
import { Page, Card, Text, Button, InlineStack, BlockStack, Badge, InlineGrid } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.check({ plans: ["Starter Plan", "Pro Plan"], isTest: true });
  const subscriptions = billingCheck.appSubscriptions;
  const activePlan = subscriptions && subscriptions.length > 0 ? subscriptions[0].name : "Free Plan";
  return json({ activePlan, isStarter: activePlan === "Starter Plan", isPro: activePlan === "Pro Plan" });
}

const TEMPLATES = [
  {
    id: "GRID",
    title: "Grid (Default)",
    description: "A standard responsive grid layout. Clean and professional.",
    plan: "Free",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='40' y='20' width='55' height='35' rx='4' fill='%23cbd5e1' /%3E%3Crect x='105' y='20' width='55' height='35' rx='4' fill='%23cbd5e1' /%3E%3Crect x='40' y='65' width='55' height='35' rx='4' fill='%23cbd5e1' /%3E%3Crect x='105' y='65' width='55' height='35' rx='4' fill='%23cbd5e1' /%3E%3C/svg%3E"
  },
  {
    id: "HERO",
    title: "Hero Image",
    description: "Displays only your very first image at full width. Perfect for a single striking banner.",
    plan: "Free",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='20' y='20' width='160' height='80' rx='4' fill='%23cbd5e1' /%3E%3C/svg%3E"
  },
  {
    id: "MASONRY",
    title: "Masonry Grid",
    description: "Pinterest style grid that perfectly fits images of different heights without gaps.",
    plan: "Starter",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='40' y='15' width='35' height='50' rx='4' fill='%23cbd5e1' /%3E%3Crect x='40' y='75' width='35' height='30' rx='4' fill='%23cbd5e1' /%3E%3Crect x='85' y='15' width='35' height='30' rx='4' fill='%23cbd5e1' /%3E%3Crect x='85' y='55' width='35' height='50' rx='4' fill='%23cbd5e1' /%3E%3Crect x='130' y='15' width='35' height='40' rx='4' fill='%23cbd5e1' /%3E%3Crect x='130' y='65' width='35' height='40' rx='4' fill='%23cbd5e1' /%3E%3C/svg%3E"
  },
  {
    id: "MOSAIC",
    title: "Featured Mosaic",
    description: "Features the first image at full size, with the rest forming a smaller grid below.",
    plan: "Starter",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='40' y='15' width='120' height='50' rx='4' fill='%23cbd5e1' /%3E%3Crect x='40' y='75' width='55' height='30' rx='4' fill='%23cbd5e1' /%3E%3Crect x='105' y='75' width='55' height='30' rx='4' fill='%23cbd5e1' /%3E%3C/svg%3E"
  },
  {
    id: "SLIDESHOW",
    title: "Slideshow",
    description: "An auto-advancing horizontal carousel. Saves vertical space.",
    plan: "Pro",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='-30' y='20' width='60' height='80' rx='4' fill='%23cbd5e1' opacity='0.5' /%3E%3Crect x='40' y='20' width='120' height='80' rx='4' fill='%23cbd5e1' /%3E%3Crect x='170' y='20' width='60' height='80' rx='4' fill='%23cbd5e1' opacity='0.5' /%3E%3C/svg%3E"
  },
  {
    id: "STACK",
    title: "Vertical Stack",
    description: "A centered, spaced vertical stack. Perfect for storytelling.",
    plan: "Pro",
    image: "data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='%23f4f6f8' /%3E%3Crect x='50' y='10' width='100' height='45' rx='4' fill='%23cbd5e1' /%3E%3Crect x='50' y='65' width='100' height='45' rx='4' fill='%23cbd5e1' /%3E%3C/svg%3E"
  }
];

export default function Templates() {
  const { isPro, isStarter } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title="Templates" subtitle="Choose a layout for your next lookbook">
      <div style={{ marginBottom: "20px" }}>
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          {TEMPLATES.map(template => (
            <Card key={template.id} padding="0">
              <div style={{ padding: "20px", background: "#f4f6f8", borderBottom: "1px solid #dfe3e8", textAlign: "center" }}>
                <img src={template.image} alt={template.title} style={{ height: "120px", objectFit: "contain", mixBlendMode: "multiply" }} />
              </div>
              <div style={{ padding: "20px" }}>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h3">{template.title}</Text>
                    {template.plan === "Pro" ? (
                      <Badge tone="magic">Pro</Badge>
                    ) : template.plan === "Starter" ? (
                      <Badge tone="info">Starter</Badge>
                    ) : (
                      <Badge tone="success">Free</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" tone="subdued" breakWord>{template.description}</Text>
                  
                  <div style={{ marginTop: "10px" }}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Button onClick={() => navigate(`/app/preview?layout=${template.id}`)} variant="plain">Live Preview</Button>
                      
                      {(() => {
                        const canApply = isPro || (isStarter && (template.plan === "Free" || template.plan === "Starter")) || template.plan === "Free";
                        if (canApply) {
                          return <Button variant="primary" onClick={() => navigate(`/app/lookbook/new?layout=${template.id}`)}>Apply</Button>;
                        } else {
                          return <Button variant="primary" tone="success" onClick={() => navigate('/app/pricing')}>Upgrade to {template.plan}</Button>;
                        }
                      })()}
                    </InlineStack>
                  </div>
                </BlockStack>
              </div>
            </Card>
          ))}
        </InlineGrid>
      </div>
    </Page>
  );
}
