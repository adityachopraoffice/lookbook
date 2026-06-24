import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  Text,
  Badge,
  EmptyState,
  Button,
  CalloutCard,
  BlockStack,
  InlineGrid
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session, billing } = await authenticate.admin(request);

  // Check billing plan
  const billingCheck = await billing.check({
    plans: ["Starter Plan", "Pro Plan"],
  });
  const subscriptions = billingCheck.appSubscriptions;
  const activePlan = subscriptions && subscriptions.length > 0 ? subscriptions[0].name : "Free Plan";
  
  const isStarter = activePlan === "Starter Plan";
  const isPro = activePlan === "Pro Plan";

  const lookbooks = await prisma.lookbook.findMany({
    where: { shop: session.shop },
    orderBy: { updatedAt: "desc" },
    include: {
      images: {
        take: 1,
        orderBy: { position: "asc" }
      }
    }
  });

  const totalHotspots = await prisma.pin.count({
    where: { image: { lookbook: { shop: session.shop } } }
  });
  
  const aggregates = await (prisma.lookbook.aggregate as any)({
    where: { shop: session.shop },
    _sum: { views: true, clicks: true }
  });
  
  const stats = {
    totalLookbooks: lookbooks.length,
    totalHotspots,
    // @ts-ignore
    totalViews: aggregates._sum?.views || 0,
    // @ts-ignore
    totalClicks: aggregates._sum?.clicks || 0
  };

  const canCreate = isPro || (isStarter && lookbooks.length < 5) || (!isStarter && !isPro && lookbooks.length < 1);

  return { lookbooks, isPro, isStarter, activePlan, canCreate, stats };
}

export async function action({ request }: any) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const ids = JSON.parse(formData.get("ids") as string);
    await prisma.lookbook.deleteMany({
      where: {
        id: { in: ids },
        shop: session.shop
      }
    });
    return json({ success: true });
  }
  return null;
}

export default function Index() {
  const { lookbooks, isPro, isStarter, activePlan, canCreate, stats } = useLoaderData<any>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const resourceName = {
    singular: "lookbook",
    plural: "lookbooks",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(lookbooks);

  const promotedBulkActions = [
    {
      content: 'Delete',
      onAction: () => {
        if (confirm("Are you sure you want to delete the selected lookbooks?")) {
          submit(
            { intent: "delete", ids: JSON.stringify(selectedResources) },
            { method: "post" }
          );
        }
      },
    },
  ];

  const rowMarkup = lookbooks.map(
    ({ id, title, status, images, updatedAt }: any, index: number) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() => navigate(`/app/lookbook/${id}`)}
      >
        <IndexTable.Cell>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {images[0] ? (
              <img
                src={images[0].imageUrl}
                alt={title}
                style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
              />
            ) : (
              <div style={{ width: "40px", height: "40px", backgroundColor: "#f4f6f8", borderRadius: "4px" }} />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {title}
              </Text>
              <Text variant="bodySm" tone="subdued" as="span">
                ID: {id}
              </Text>
            </div>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === "PUBLISHED" ? "success" : "info"}>
            {status}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(updatedAt).toLocaleDateString()}
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const customStyles = `
    .stat-card {
      padding: 24px;
      border-radius: 12px;
      color: white;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      height: 100%;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -10px rgba(0,0,0,0.3);
    }
    .stat-lookbooks { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .stat-hotspots { background: linear-gradient(135deg, #f43f5e, #fb923c); }
    .stat-views { background: linear-gradient(135deg, #10b981, #3b82f6); }
    
    .stat-title { font-size: 15px; opacity: 0.9; margin-bottom: 8px; font-weight: 500; }
    .stat-value { font-size: 36px; font-weight: bold; line-height: 1; }

    .live-preview-banner {
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      border-radius: 16px;
      padding: 32px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(139, 92, 246, 0.3);
      box-shadow: 0 10px 30px -15px rgba(139, 92, 246, 0.3);
      transition: transform 0.3s ease;
    }
    .live-preview-banner:hover {
      transform: translateY(-2px);
    }
    .live-preview-banner::after {
      content: "";
      position: absolute;
      top: -50%; right: -10%;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,0,0,0) 70%);
      pointer-events: none;
    }
    .banner-content { position: relative; z-index: 1; max-width: 600px; }
    .banner-title { font-size: 24px; font-weight: bold; margin-bottom: 12px; }
    .banner-text { font-size: 15px; color: #cbd5e1; margin-bottom: 24px; line-height: 1.6; }
    .banner-btn {
      background: linear-gradient(to right, #8b5cf6, #38bdf8);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
    .banner-btn:hover { 
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    }
  `;

  return (
    <Page
      title="Dashboard"
      subtitle="Manage your interactive lookbooks and view performance."
      primaryAction={{
        content: canCreate ? "Create lookbook" : "Upgrade to Create More",
        onAction: () => canCreate ? navigate("/app/lookbook/new") : navigate("/app/pricing"),
        disabled: !canCreate && isPro
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <InlineGrid columns={3} gap="400">
              <div className="stat-card stat-lookbooks">
                <div className="stat-title">Total Lookbooks</div>
                <div className="stat-value">{stats?.totalLookbooks || 0}</div>
              </div>
              <div className="stat-card stat-hotspots">
                <div className="stat-title">Total Hotspots</div>
                <div className="stat-value">{stats?.totalHotspots || 0}</div>
              </div>
              <div className="stat-card stat-views">
                <div className="stat-title">Storefront Views</div>
                <div className="stat-value">{stats?.totalViews || 0}</div>
              </div>
            </InlineGrid>
          </Layout.Section>

          <Layout.Section>
            <div className="live-preview-banner">
              <div className="banner-content">
                <div className="banner-title">Test your layouts with Live Preview</div>
                <div className="banner-text">Want to see exactly what your lookbooks will look like on your store? Use the new Live Preview tab to test our new Masonry and Mosaic layouts before publishing.</div>
                <button className="banner-btn" onClick={() => navigate('/app/preview')}>Try Live Preview</button>
              </div>
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="url(#preview-gradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", zIndex: 1, opacity: 0.8 }}>
                <defs>
                  <linearGradient id="preview-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
                <line x1="2" y1="7" x2="22" y2="7"></line>
              </svg>
            </div>
          </Layout.Section>
        <Layout.Section>
          <Card padding="400">
            <Text as="h2" variant="headingMd">{activePlan} Active</Text>
            {activePlan === "Free Plan" && (
              <p style={{ marginTop: '8px' }}>You are on the Free plan (1 lookbook, max 5 hotspots). <span onClick={() => navigate('/app/pricing')} style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', color: '#005bd3' }}>Upgrade to Starter or Pro</span> for more features.</p>
            )}
            {activePlan === "Starter Plan" && (
              <p style={{ marginTop: '8px' }}>You are on the Starter plan (up to 5 lookbooks). <span onClick={() => navigate('/app/pricing')} style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', color: '#005bd3' }}>Upgrade to Pro</span> for unlimited lookbooks and premium layouts.</p>
            )}
            {activePlan === "Pro Plan" && (
              <p style={{ marginTop: '8px' }}>You are on the Pro plan. You have unlimited access to all lookbooks, premium layouts, and custom storefront features.</p>
            )}
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card padding="0">
            {lookbooks.length === 0 ? (
              <EmptyState
                heading="Create your first shoppable lookbook"
                action={{
                  content: "Create lookbook",
                  onAction: () => navigate("/app/lookbook/new"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Upload styled photos and tag products to make them shoppable.</p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={lookbooks.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                promotedBulkActions={promotedBulkActions}
                headings={[
                  { title: "Title" },
                  { title: "Status" },
                  { title: "Last updated" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>
      </Layout>
      </BlockStack>
    </Page>
  );
}
