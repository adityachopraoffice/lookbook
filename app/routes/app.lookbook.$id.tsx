import { useState, useCallback, useEffect } from "react";
import { json, redirect, unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useNavigate, useFetcher } from "react-router";
import {
  Page, Layout, Card, FormLayout, TextField, Select, Button, BlockStack,
  InlineStack, Text, Badge, PageActions, DropZone, Thumbnail, Icon, Modal,
  ResourceList, ResourceItem, Avatar
} from "@shopify/polaris";
import { PlusIcon, DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { uploadFileToShopify } from "../utils/shopifyUpload";

export async function loader({ request, params }: any) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  const defaultLayout = settings?.defaultLayout || "GRID";

  if (id === "new") {
    return {
      lookbook: { title: "", status: "DRAFT", layout: defaultLayout, images: [] },
      isNew: true
    };
  }

  const lookbook = await prisma.lookbook.findUnique({
    where: { id, shop: session.shop },
    include: {
      images: {
        orderBy: { position: "asc" },
        include: { pins: true }
      }
    }
  });

  if (!lookbook) {
    throw new Response("Not Found", { status: 404 });
  }

  return { lookbook, isNew: false };
}

export async function action({ request, params }: any) {
  const { admin, session } = await authenticate.admin(request);
  
  let formData;
  const contentType = request.headers.get("Content-Type") || "";
  
  if (contentType.includes("multipart/form-data")) {
    const uploadHandler = unstable_createMemoryUploadHandler({ maxPartSize: 5_000_000 });
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } else {
    formData = await request.formData();
  }
  
  const intent = formData.get("intent");
  
  if (intent === "delete" && params.id !== "new") {
    await prisma.lookbook.delete({ where: { id: params.id, shop: session.shop } });
    return redirect("/app");
  }

  if (intent === "deleteImage") {
    const imageId = formData.get("imageId") as string;
    await prisma.lookbookImage.delete({ where: { id: imageId } });
    return json({ success: true });
  }

  if (intent === "uploadImage") {
    const file = formData.get("file") as File;
    if (!file || !file.name) return json({ error: "No file provided" }, { status: 400 });

    try {
      const shopifyFile = await uploadFileToShopify(admin, file);
      let imageUrl = shopifyFile?.image?.url || "";
      if (!imageUrl && shopifyFile?.originalSource) imageUrl = shopifyFile.originalSource;
      if (!imageUrl) imageUrl = "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"; // Fallback placeholder

      const position = await prisma.lookbookImage.count({ where: { lookbookId: params.id } });
      const newImage = await prisma.lookbookImage.create({
        data: { lookbookId: params.id, imageUrl: imageUrl, position: position }
      });
      return json({ image: newImage });
    } catch (e: any) {
      return json({ error: e.message }, { status: 500 });
    }
  }

  if (intent === "savePin") {
    // Enforce 5 hotspot limit for free plan
    const { billing } = await authenticate.admin(request);
    const billingCheck = await billing.check({ plans: ["Pro Plan"], isTest: true });
    
    if (!billingCheck.hasActivePayment) {
      const totalPins = await prisma.pin.count({
        where: { image: { lookbookId: params.id } }
      });
      if (totalPins >= 5) {
        return json({ error: "Free plan limit reached (max 5 hotspots). Please upgrade to Pro." }, { status: 403 });
      }
    }

    const imageId = formData.get("imageId") as string;
    const xPercent = parseFloat(formData.get("xPercent") as string);
    const yPercent = parseFloat(formData.get("yPercent") as string);
    const productId = formData.get("productId") as string;
    
    const pin = await prisma.pin.create({
      data: { imageId, xPercent, yPercent, productId }
    });
    return json({ pin });
  }

  if (intent === "deletePin") {
    const pinId = formData.get("pinId") as string;
    await prisma.pin.delete({ where: { id: pinId } });
    return json({ success: true });
  }

  // Default save lookbook
  const title = formData.get("title") as string;
  const status = formData.get("status") as string;
  const layout = formData.get("layout") as string;
  
  const data = { title, status, layout, shop: session.shop };

  if (params.id === "new") {
    const { billing } = await authenticate.admin(request);
    const billingCheck = await billing.check({ plans: ["Pro Plan"], isTest: true });
    
    if (!billingCheck.hasActivePayment) {
      const totalLookbooks = await prisma.lookbook.count({ where: { shop: session.shop } });
      if (totalLookbooks >= 1) {
        return json({ error: "Free plan limit reached (1 lookbook). Please upgrade to Pro." }, { status: 403 });
      }
    }

    const lookbook = await prisma.lookbook.create({ data });
    return redirect(`/app/lookbook/${lookbook.id}`);
  } else {
    await prisma.lookbook.update({
      where: { id: params.id, shop: session.shop },
      data
    });
    return json({ success: true });
  }
}

export default function LookbookForm() {
  const { lookbook, isNew } = useLoaderData<any>();
  const [title, setTitle] = useState(lookbook.title);
  const [status, setStatus] = useState(lookbook.status);
  const [layout, setLayout] = useState(lookbook.layout);
  
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isSaving = navigation.state === "submitting";

  // Hotspot Editor State
  const [activeImage, setActiveImage] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempPin, setTempPin] = useState<{x: number, y: number} | null>(null);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("status", status);
    formData.append("layout", layout);
    submit(formData, { method: "post" });
  }, [title, status, layout, submit]);

  const handleDelete = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "delete");
    submit(formData, { method: "post" });
  }, [submit]);

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const formData = new FormData();
        formData.append("intent", "uploadImage");
        formData.append("file", acceptedFiles[0]);
        fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
      }
    },
    [fetcher]
  );

  const openHotspotEditor = (image: any) => {
    setActiveImage(image);
    setIsEditorOpen(true);
    setTempPin(null);
  };

  const handleImageClick = async (e: any) => {
    if (!activeImage) return;
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempPin({ x, y });

    // Open Shopify Resource Picker
    const selected = await (window as any).shopify.resourcePicker({ type: "product", action: "select", multiple: false });
    if (selected && selected.length > 0) {
      const product = selected[0];
      const formData = new FormData();
      formData.append("intent", "savePin");
      formData.append("imageId", activeImage.id);
      formData.append("xPercent", x.toString());
      formData.append("yPercent", y.toString());
      formData.append("productId", product.id);
      fetcher.submit(formData, { method: "post" });
      setTempPin(null);
    } else {
      setTempPin(null); // Cancelled
    }
  };

  // Check for error from savePin action
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).error) {
      (window as any).shopify.toast.show((fetcher.data as any).error, { isError: true });
    }
  }, [fetcher.data]);

  const deletePin = (pinId: string) => {
    const formData = new FormData();
    formData.append("intent", "deletePin");
    formData.append("pinId", pinId);
    fetcher.submit(formData, { method: "post" });
  };

  const deleteImage = (imageId: string) => {
    const formData = new FormData();
    formData.append("intent", "deleteImage");
    formData.append("imageId", imageId);
    fetcher.submit(formData, { method: "post" });
  };

  // Update activeImage when fetcher data returns (e.g. pin saved)
  useEffect(() => {
    if (fetcher.state === "idle" && activeImage) {
      const updatedImage = lookbook.images.find((img: any) => img.id === activeImage.id);
      if (updatedImage) setActiveImage(updatedImage);
    }
  }, [fetcher.state, lookbook.images, activeImage]);

  return (
    <Page
      backAction={{ content: "Lookbooks", onAction: () => navigate("/app") }}
      title={isNew ? "Create lookbook" : title}
      titleMetadata={!isNew ? <Badge tone={status === "PUBLISHED" ? "success" : "info"}>{status}</Badge> : undefined}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <FormLayout>
                <TextField label="Title" value={title} onChange={setTitle} autoComplete="off" />
              </FormLayout>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Images & Hotspots</Text>
                {isNew ? (
                  <Text as="p" tone="subdued">Save the lookbook first to upload images and add hotspots.</Text>
                ) : (
                  <>
                    <DropZone onDrop={handleDropZoneDrop} variableHeight>
                      {fetcher.state === "submitting" ? (
                        <DropZone.FileUpload actionHint="Uploading..." />
                      ) : (
                        <DropZone.FileUpload actionTitle="Add images" actionHint="or drop files to upload" />
                      )}
                    </DropZone>
                    
                    {lookbook.images.length > 0 && (
                      <ResourceList
                        resourceName={{ singular: 'image', plural: 'images' }}
                        items={lookbook.images}
                        renderItem={(item: any) => {
                          const { id, imageUrl, pins } = item;
                          return (
                            <ResourceItem id={id} onClick={() => openHotspotEditor(item)}>
                              <InlineStack wrap={false} align="space-between" blockAlign="center">
                                <InlineStack wrap={false} gap="400" blockAlign="center">
                                  <Thumbnail source={imageUrl || ""} alt="Lookbook image" />
                                  <Text variant="bodyMd" fontWeight="bold" as="span">Image {item.position + 1}</Text>
                                </InlineStack>
                                <InlineStack wrap={false} gap="400" blockAlign="center">
                                  <Badge>{`${pins?.length || 0} hotspots`}</Badge>
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Button tone="critical" variant="plain" icon={DeleteIcon} onClick={() => deleteImage(id)} accessibilityLabel="Delete image" />
                                  </div>
                                </InlineStack>
                              </InlineStack>
                            </ResourceItem>
                          );
                        }}
                      />
                    )}
                  </>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Status</Text>
                <Select
                  label="Publish status"
                  options={[{ label: "Draft", value: "DRAFT" }, { label: "Published", value: "PUBLISHED" }]}
                  value={status}
                  onChange={setStatus}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Layout</Text>
                <Select
                  label="Storefront layout"
                  options={[
                    { label: "Grid (Default)", value: "GRID" },
                    { label: "Hero Image", value: "HERO" },
                    { label: "Slideshow", value: "SLIDESHOW" },
                    { label: "Masonry Grid", value: "MASONRY" },
                    { label: "Vertical Stack", value: "STACK" },
                    { label: "Featured Mosaic", value: "MOSAIC" },
                  ]}
                  value={layout}
                  onChange={setLayout}
                />
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Theme Setup</Text>
                {isNew ? (
                  <Text as="p" tone="subdued">Save the lookbook to get your ID.</Text>
                ) : (
                  <BlockStack gap="200">
                    <Text as="p" tone="subdued">Copy this Lookbook ID and paste it into the Theme Editor block settings:</Text>
                    <TextField
                      label="Lookbook ID"
                      labelHidden
                      value={lookbook.id}
                      autoComplete="off"
                      readOnly
                      selectTextOnFocus
                    />
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      <PageActions
        primaryAction={{ content: "Save", onAction: handleSave, loading: isSaving, disabled: !title }}
        secondaryActions={!isNew ? [{ content: "Delete", destructive: true, onAction: handleDelete }] : undefined}
      />

      {/* Hotspot Editor Modal */}
      {isEditorOpen && activeImage && (
        <Modal
          open={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title="Edit Hotspots"
          size="large"
        >
          <Modal.Section>
            <Text as="p" tone="subdued">Click anywhere on the image to drop a pin and link a product.</Text>
            <div style={{ marginTop: "1rem", display: "flex", gap: "2rem" }}>
              <div 
                style={{ position: "relative", cursor: "crosshair", display: "inline-block", maxWidth: "60%" }}
                onClick={handleImageClick}
              >
                <img src={activeImage.imageUrl} alt="Lookbook" style={{ width: "100%", height: "auto", display: "block" }} />
                
                {/* Render saved pins */}
                {activeImage.pins?.map((pin: any) => (
                  <div
                    key={pin.id}
                    style={{
                      position: "absolute",
                      top: `${pin.yPercent}%`,
                      left: `${pin.xPercent}%`,
                      transform: "translate(-50%, -50%)",
                      width: "20px", height: "20px",
                      backgroundColor: "white",
                      border: "3px solid black",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                ))}

                {/* Render temp pin */}
                {tempPin && (
                  <div
                    style={{
                      position: "absolute",
                      top: `${tempPin.y}%`,
                      left: `${tempPin.x}%`,
                      transform: "translate(-50%, -50%)",
                      width: "20px", height: "20px",
                      backgroundColor: "white",
                      border: "3px solid blue",
                      borderRadius: "50%",
                      boxShadow: "0 0 0 4px rgba(0,0,255,0.2)"
                    }}
                  />
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Hotspots ({activeImage.pins?.length || 0})</Text>
                  {activeImage.pins?.length === 0 && <Text as="p">No hotspots added yet.</Text>}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {activeImage.pins?.map((pin: any, idx: number) => (
                      <Card key={pin.id} padding="400">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="span" fontWeight="bold">Pin {idx + 1}</Text>
                          <Button tone="critical" variant="plain" icon={DeleteIcon} onClick={() => deletePin(pin.id)} accessibilityLabel="Delete pin" />
                        </InlineStack>
                        <Text as="p" tone="subdued">Product: {pin.productId.split('/').pop()}</Text>
                      </Card>
                    ))}
                  </div>
                </BlockStack>
              </div>
            </div>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
