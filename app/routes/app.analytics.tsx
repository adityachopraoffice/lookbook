import { json } from "@remix-run/node";
import { useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  DataTable,
  Badge
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);

  const lookbooks = await (prisma.lookbook as any).findMany({
    where: { shop: session.shop },
    orderBy: { views: "desc" },
    include: {
      images: {
        take: 1,
        orderBy: { position: "asc" }
      }
    }
  });

  const totalViews = lookbooks.reduce((acc: number, lb: any) => acc + lb.views, 0);
  const totalClicks = lookbooks.reduce((acc: number, lb: any) => acc + lb.clicks, 0);

  const lookbookData = lookbooks.map((lb: any) => ({
    id: lb.id,
    title: lb.title,
    imageUrl: lb.images?.[0]?.imageUrl,
    views: lb.views,
    clicks: lb.clicks,
    clickRate: lb.views > 0 ? `${((lb.clicks / lb.views) * 100).toFixed(1)}%` : "0%",
    status: lb.status
  }));

  return json({
    totalViews,
    totalClicks,
    lookbookData
  });
}

export default function Analytics() {
  const { totalViews, totalClicks, lookbookData } = useLoaderData<any>();

  const rows = lookbookData.map((lb: any) => [
    <div key={lb.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {lb.imageUrl ? (
        <img
          src={lb.imageUrl}
          alt={lb.title}
          style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
        />
      ) : (
        <div style={{ width: "40px", height: "40px", backgroundColor: "#f4f6f8", borderRadius: "4px" }} />
      )}
      <Text variant="bodyMd" fontWeight="bold" as="span">{lb.title}</Text>
    </div>,
    lb.views.toString(),
    lb.clicks.toString(),
    lb.clickRate,
    <Badge key={`badge-${lb.id}`} tone={lb.status === "PUBLISHED" ? "success" : "info"}>{lb.status}</Badge>
  ]);

  return (
    <Page title="Analytics">
      <Layout>
        <Layout.Section>
          <InlineGrid gap="400" columns={2}>
            <Card padding="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">Total Views</Text>
                <Text as="p" variant="heading3xl">{totalViews}</Text>
              </BlockStack>
            </Card>
            <Card padding="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">Total Pin Clicks</Text>
                <Text as="p" variant="heading3xl">{totalClicks}</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>
        
        <Layout.Section>
          <Card padding="0">
            <div style={{ padding: '16px' }}>
              <Text as="h2" variant="headingMd">Lookbook Performance</Text>
            </div>
            <DataTable
              columnContentTypes={[
                'text',
                'numeric',
                'numeric',
                'numeric',
                'text',
              ]}
              headings={[
                'Lookbook',
                'Views',
                'Pin Clicks',
                'Click Rate',
                'Status'
              ]}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
