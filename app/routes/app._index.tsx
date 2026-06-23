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
  Button
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session, billing } = await authenticate.admin(request);

  // Check billing plan
  const billingCheck = await billing.check({
    plans: ["Pro Plan"],
    isTest: true,
  });
  const isPro = billingCheck.hasActivePayment;

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

  const canCreate = isPro || lookbooks.length < 1;

  return { lookbooks, isPro, canCreate };
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
  const { lookbooks, isPro, canCreate } = useLoaderData<any>();
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

  return (
    <Page
      title="Lookbooks"
      primaryAction={{
        content: canCreate ? "Create lookbook" : "Upgrade to Pro to Create",
        onAction: () => canCreate ? navigate("/app/lookbook/new") : navigate("/app/pricing"),
        disabled: !canCreate && isPro
      }}
    >
      <Layout>
        {!isPro && (
          <Layout.Section>
            <Card padding="400">
              <Text as="h2" variant="headingMd">Free Plan Active</Text>
              <p>You are on the Free plan (1 lookbook, max 5 hotspots). <a href="/app/pricing" style={{ fontWeight: 'bold' }}>Upgrade to Pro ($9.99/mo)</a> for unlimited lookbooks and hotspots.</p>
            </Card>
          </Layout.Section>
        )}
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
    </Page>
  );
}
