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
  const averageClickRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

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
    averageClickRate,
    lookbookData
  });
}

export default function Analytics() {
  const { totalViews, totalClicks, averageClickRate, lookbookData } = useLoaderData<any>();

  const rows = lookbookData.map((lb: any) => [
    <div key={lb.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {lb.imageUrl ? (
        <img
          src={lb.imageUrl}
          alt={lb.title}
          style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
        />
      ) : (
        <div style={{ width: "48px", height: "48px", backgroundColor: "#f1f5f9", borderRadius: "8px" }} />
      )}
      <Text variant="bodyMd" fontWeight="bold" as="span">{lb.title}</Text>
    </div>,
    <Text as="span" variant="bodyMd" fontWeight="semibold">{lb.views.toLocaleString()}</Text>,
    <Text as="span" variant="bodyMd" fontWeight="semibold">{lb.clicks.toLocaleString()}</Text>,
    <Badge tone={parseFloat(lb.clickRate) > 10 ? "success" : "info"}>{lb.clickRate}</Badge>,
    <Badge key={`badge-${lb.id}`} tone={lb.status === "PUBLISHED" ? "success" : "new"}>{lb.status}</Badge>
  ]);

  const customStyles = `
    .stat-card {
      padding: 32px;
      border-radius: 16px;
      color: white;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      height: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px -10px rgba(0,0,0,0.25);
    }
    .stat-card::after {
      content: "";
      position: absolute;
      top: -50%; right: -20%;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%);
      pointer-events: none;
    }
    
    .stat-views { background: linear-gradient(135deg, #8b5cf6, #38bdf8); box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4); }
    .stat-clicks { background: linear-gradient(135deg, #ec4899, #f43f5e); box-shadow: 0 10px 20px -5px rgba(236, 72, 153, 0.4); }
    .stat-rate { background: linear-gradient(135deg, #10b981, #14b8a6); box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); }
    
    .stat-title { font-size: 16px; opacity: 0.9; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 48px; font-weight: 900; line-height: 1; margin-bottom: 16px; }
    
    .stat-icon {
      position: absolute;
      bottom: -10px;
      right: -10px;
      width: 100px;
      height: 100px;
      opacity: 0.15;
    }

    .analytics-table-container {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background: white;
    }
    .analytics-header {
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(to right, #f8fafc, #ffffff);
    }
  `;

  return (
    <Page title="Performance Analytics" subtitle="Track how shoppers are interacting with your lookbooks">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Layout>
        <Layout.Section>
          <InlineGrid gap="400" columns={{ xs: 1, sm: 1, md: 3 }}>
            <div className="stat-card stat-views">
              <div>
                <div className="stat-title">Total Storefront Views</div>
                <div className="stat-value">{totalViews.toLocaleString()}</div>
              </div>
              <Text as="p" variant="bodySm">Across all published lookbooks</Text>
              <svg className="stat-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
            </div>
            
            <div className="stat-card stat-clicks">
              <div>
                <div className="stat-title">Total Product Clicks</div>
                <div className="stat-value">{totalClicks.toLocaleString()}</div>
              </div>
              <Text as="p" variant="bodySm">Direct interactions with hotspots</Text>
              <svg className="stat-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" /></svg>
            </div>

            <div className="stat-card stat-rate">
              <div>
                <div className="stat-title">Avg. Click-Through Rate</div>
                <div className="stat-value">{averageClickRate}%</div>
              </div>
              <Text as="p" variant="bodySm">Percentage of views resulting in a click</Text>
              <svg className="stat-icon" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
            </div>
          </InlineGrid>
        </Layout.Section>
        
        <Layout.Section>
          <div className="analytics-table-container">
            <div className="analytics-header">
              <Text as="h2" variant="headingLg">Lookbook Performance Breakdown</Text>
              <Text as="p" tone="subdued">Detailed analytics for every lookbook you've created.</Text>
            </div>
            {lookbookData.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Text as="p" tone="subdued">You haven't created any lookbooks yet.</Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'text', 'text']}
                headings={['Lookbook', 'Views', 'Pin Clicks', 'Click Rate', 'Status']}
                rows={rows}
                hoverable
              />
            )}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
