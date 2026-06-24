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

// Helper to wrap SVGs with proper gradients and styling
const generateSVG = (plan: string, shapes: string) => {
  let colors = { bg: "#f8fafc", shape1: "#94a3b8", shape2: "#cbd5e1" };
  if (plan === "Free") colors = { bg: "#eff6ff", shape1: "#3b82f6", shape2: "#93c5fd" };
  if (plan === "Starter") colors = { bg: "#ecfdf5", shape1: "#10b981", shape2: "#6ee7b7" };
  if (plan === "Pro") colors = { bg: "#f5f3ff", shape1: "#8b5cf6", shape2: "#c4b5fd" };

  // Replace placeholders in the shapes with the actual colors
  const styledShapes = shapes
    .replace(/%COLOR1%/g, colors.shape1)
    .replace(/%COLOR2%/g, colors.shape2);

  return `data:image/svg+xml,%3Csvg width='200' height='120' viewBox='0 0 200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='120' fill='${colors.bg.replace('#', '%23')}' /%3E${styledShapes}%3C/svg%3E`;
};

const TEMPLATES = [
  {
    id: "GRID",
    title: "Grid (Default)",
    description: "A standard responsive grid layout. Clean and professional.",
    plan: "Free",
    image: generateSVG("Free", "%3Crect x='40' y='20' width='55' height='35' rx='6' fill='%233b82f6' /%3E%3Crect x='105' y='20' width='55' height='35' rx='6' fill='%2393c5fd' /%3E%3Crect x='40' y='65' width='55' height='35' rx='6' fill='%2393c5fd' /%3E%3Crect x='105' y='65' width='55' height='35' rx='6' fill='%233b82f6' /%3E")
  },
  {
    id: "HERO",
    title: "Hero Image",
    description: "Displays only your very first image at full width. Perfect for a single striking banner.",
    plan: "Free",
    image: generateSVG("Free", "%3Crect x='20' y='20' width='160' height='80' rx='8' fill='%233b82f6' /%3E")
  },
  {
    id: "MASONRY",
    title: "Masonry Grid",
    description: "Pinterest style grid that perfectly fits images of different heights without gaps.",
    plan: "Starter",
    image: generateSVG("Starter", "%3Crect x='40' y='15' width='35' height='50' rx='6' fill='%2310b981' /%3E%3Crect x='40' y='75' width='35' height='30' rx='6' fill='%236ee7b7' /%3E%3Crect x='85' y='15' width='35' height='30' rx='6' fill='%236ee7b7' /%3E%3Crect x='85' y='55' width='35' height='50' rx='6' fill='%2310b981' /%3E%3Crect x='130' y='15' width='35' height='40' rx='6' fill='%2310b981' /%3E%3Crect x='130' y='65' width='35' height='40' rx='6' fill='%236ee7b7' /%3E")
  },
  {
    id: "MOSAIC",
    title: "Featured Mosaic",
    description: "Features the first image at full size, with the rest forming a smaller grid below.",
    plan: "Starter",
    image: generateSVG("Starter", "%3Crect x='40' y='15' width='120' height='50' rx='6' fill='%2310b981' /%3E%3Crect x='40' y='75' width='55' height='30' rx='6' fill='%236ee7b7' /%3E%3Crect x='105' y='75' width='55' height='30' rx='6' fill='%236ee7b7' /%3E")
  },
  {
    id: "SLIDESHOW",
    title: "Slideshow",
    description: "An auto-advancing horizontal carousel. Saves vertical space.",
    plan: "Pro",
    image: generateSVG("Pro", "%3Crect x='-30' y='20' width='60' height='80' rx='8' fill='%23c4b5fd' opacity='0.7' /%3E%3Crect x='40' y='20' width='120' height='80' rx='8' fill='%238b5cf6' /%3E%3Crect x='170' y='20' width='60' height='80' rx='8' fill='%23c4b5fd' opacity='0.7' /%3E")
  },
  {
    id: "STACK",
    title: "Vertical Stack",
    description: "A centered, spaced vertical stack. Perfect for storytelling.",
    plan: "Pro",
    image: generateSVG("Pro", "%3Crect x='50' y='10' width='100' height='45' rx='6' fill='%238b5cf6' /%3E%3Crect x='50' y='65' width='100' height='45' rx='6' fill='%23c4b5fd' /%3E")
  }
];

export default function Templates() {
  const { isPro, isStarter } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const customStyles = `
    .template-card-container {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .template-card-container:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
    }
    .template-card-image {
      padding: 30px;
      text-align: center;
      transition: background-color 0.3s ease;
    }
    .template-image-element {
      height: 120px;
      object-fit: contain;
      mix-blend-mode: multiply;
      transition: transform 0.3s ease;
    }
    .template-card-container:hover .template-image-element {
      transform: scale(1.05);
    }
    .template-card-body {
      padding: 24px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
  `;

  return (
    <Page title="Templates" subtitle="Choose a layout for your next lookbook">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div style={{ marginBottom: "20px" }}>
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          {TEMPLATES.map(template => {
            const isFree = template.plan === "Free";
            const isStarterTemplate = template.plan === "Starter";
            const isProTemplate = template.plan === "Pro";
            
            let bgClass = isProTemplate ? "#f5f3ff" : isStarterTemplate ? "#ecfdf5" : "#eff6ff";

            return (
              <Card key={template.id} padding="0">
                <div className="template-card-container">
                  <div className="template-card-image" style={{ background: bgClass }}>
                    <img src={template.image} alt={template.title} className="template-image-element" />
                  </div>
                  <div className="template-card-body">
                    <BlockStack gap="400" align="space-between" style={{ height: '100%' }}>
                      <InlineStack align="space-between" blockAlign="center" wrap={false}>
                        <Text variant="headingMd" as="h3" truncate>{template.title}</Text>
                        {isProTemplate ? (
                          <Badge tone="magic">Pro</Badge>
                        ) : isStarterTemplate ? (
                          <Badge tone="info">Starter</Badge>
                        ) : (
                          <Badge tone="success">Free</Badge>
                        )}
                      </InlineStack>
                      
                      <InlineStack align="space-between" blockAlign="center" wrap={false}>
                        <Button onClick={() => navigate(`/app/preview?layout=${template.id}`)} variant="plain">Live Preview</Button>
                        
                        {(() => {
                          const canApply = isPro || (isStarter && (template.plan === "Free" || template.plan === "Starter")) || template.plan === "Free";
                          if (canApply) {
                            return <Button variant="primary" onClick={() => navigate(`/app/lookbook/new?layout=${template.id}`)}>Apply</Button>;
                          } else {
                            return <Button variant="primary" tone="success" onClick={() => navigate('/app/pricing')}>Upgrade</Button>;
                          }
                        })()}
                      </InlineStack>
                    </BlockStack>
                  </div>
                </div>
              </Card>
            );
          })}
        </InlineGrid>
      </div>
    </Page>
  );
}
