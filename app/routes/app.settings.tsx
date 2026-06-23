import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  Select,
  Text,
  Button,
  BlockStack,
  TextField,
  PageActions
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);
  
  let settings = await prisma.shopSettings.findUnique({
    where: { shop: session.shop }
  });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: { shop: session.shop }
    });
  }

  return { settings };
}

export async function action({ request }: any) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const defaultLayout = formData.get("defaultLayout") as string;
  const hotspotColor = formData.get("hotspotColor") as string;

  await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      defaultLayout,
      hotspotColor
    }
  });

  return json({ success: true });
}

export default function Settings() {
  const { settings } = useLoaderData<any>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [defaultLayout, setDefaultLayout] = useState(settings.defaultLayout);
  const [hotspotColor, setHotspotColor] = useState(settings.hotspotColor);
  const isSaving = navigation.state === "submitting";

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("defaultLayout", defaultLayout);
    formData.append("hotspotColor", hotspotColor);
    submit(formData, { method: "post" });
  }, [defaultLayout, hotspotColor, submit]);

  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Lookbook Defaults</Text>
                <FormLayout>
                  <Select
                    label="Default Storefront Layout"
                    options={[
                      { label: "Grid", value: "GRID" },
                      { label: "Hero Image", value: "HERO" },
                      { label: "Slideshow", value: "SLIDESHOW" },
                    ]}
                    value={defaultLayout}
                    onChange={setDefaultLayout}
                    helpText="This layout will be pre-selected when creating new lookbooks."
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Storefront Appearance</Text>
                <FormLayout>
                  <TextField
                    label="Hotspot Dot Color (Hex)"
                    value={hotspotColor}
                    onChange={setHotspotColor}
                    autoComplete="off"
                    helpText="Set the default color for the hotspot dots on your storefront (e.g. #000000 or #FF5500). This can be overridden in the Theme Editor."
                  />
                  <div style={{
                    marginTop: '10px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: hotspotColor,
                    border: '2px solid #ccc'
                  }} />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      <PageActions
        primaryAction={{
          content: "Save",
          onAction: handleSave,
          loading: isSaving,
        }}
      />
    </Page>
  );
}
