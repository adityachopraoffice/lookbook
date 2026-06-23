import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "react-router";
import { Page, Card, Text, Button, InlineStack, BlockStack, Badge, InlineGrid } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }: any) {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.check({ plans: ["Pro Plan"], isTest: true });
  return json({ isPro: billingCheck.hasActivePayment });
}

const TEMPLATES = [
  {
    id: "GRID",
    title: "Grid (Default)",
    description: "A standard responsive grid layout. Clean and professional.",
    isPro: false,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  },
  {
    id: "HERO",
    title: "Hero Image",
    description: "Displays only your very first image at full width. Perfect for a single striking banner.",
    isPro: false,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  },
  {
    id: "SLIDESHOW",
    title: "Slideshow",
    description: "An auto-advancing horizontal carousel. Saves vertical space.",
    isPro: false,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  },
  {
    id: "MASONRY",
    title: "Masonry Grid",
    description: "Pinterest style grid that perfectly fits images of different heights without gaps.",
    isPro: true,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  },
  {
    id: "STACK",
    title: "Vertical Stack",
    description: "A centered, spaced vertical stack. Perfect for storytelling.",
    isPro: true,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  },
  {
    id: "MOSAIC",
    title: "Featured Mosaic",
    description: "Features the first image at full size, with the rest forming a smaller grid below.",
    isPro: true,
    image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  }
];

export default function Templates() {
  const { isPro } = useLoaderData<typeof loader>();
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
                    {template.isPro ? (
                      <Badge tone="magic">Pro</Badge>
                    ) : (
                      <Badge tone="success">Free</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" tone="subdued" breakWord>{template.description}</Text>
                  
                  <div style={{ marginTop: "10px" }}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Button onClick={() => navigate(`/app/preview`)} variant="plain">Live Preview</Button>
                      {!isPro && template.isPro ? (
                        <Button variant="primary" tone="success" onClick={() => navigate('/app/pricing')}>Upgrade</Button>
                      ) : (
                        <Button variant="primary" onClick={() => navigate(`/app/lookbook/new?layout=${template.id}`)}>Apply</Button>
                      )}
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
