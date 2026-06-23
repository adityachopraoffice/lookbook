import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigate } from "react-router";
import { Page, Layout, Card, Select, BlockStack, InlineStack, Button, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const selectedId = url.searchParams.get("id");

  const lookbooks = await (prisma.lookbook as any).findMany({
    where: { shop: session.shop },
    include: { images: { orderBy: { position: "asc" }, include: { pins: true } } }
  });

  let productData: Record<string, any> = {};
  let selectedLookbook = null;

  if (selectedId) {
    selectedLookbook = lookbooks.find((lb: any) => lb.id === selectedId);
  } else if (lookbooks.length > 0) {
    selectedLookbook = lookbooks[0];
  }

  if (selectedLookbook) {
    const productGids = new Set<string>();
    selectedLookbook.images.forEach((img: any) => img.pins.forEach((pin: any) => productGids.add(pin.productId)));
    
    for (const gid of Array.from(productGids)) {
      try {
        const res = await admin.graphql(`
          query {
            product(id: "${gid}") {
              title
              handle
              featuredImage { url }
              priceRangeV2 { minVariantPrice { amount currencyCode } }
              variants(first: 1) { edges { node { id } } }
            }
          }
        `);
        const jsonRes = await res.json();
        if (jsonRes.data?.product) {
          productData[gid] = jsonRes.data.product;
        }
      } catch (e) {}
    }
  }

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  
  return json({
    lookbooks,
    selectedLookbook,
    productData,
    hotspotColor: settings?.hotspotColor || "#000000"
  });
}

export default function Preview() {
  const { lookbooks, selectedLookbook, productData, hotspotColor } = useLoaderData<any>();
  const submit = useSubmit();
  const navigate = useNavigate();

  // Local state for toggling layout without saving
  const [activeLayout, setActiveLayout] = useState(selectedLookbook?.layout || "GRID");

  useEffect(() => {
    if (selectedLookbook) {
      setActiveLayout(selectedLookbook.layout);
    }
  }, [selectedLookbook]);

  const handleLookbookChange = (id: string) => {
    submit({ id }, { method: "get" });
  };

  const formatMoney = (price: any) => {
    if (!price) return "";
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currencyCode }).format(price.amount);
  };

  let containerClass = "lb-grid";
  if (activeLayout === "HERO") containerClass = "lb-hero";
  if (activeLayout === "SLIDESHOW") containerClass = "lb-slideshow";

  return (
    <Page title="Live Preview" backAction={{ content: "Lookbooks", onAction: () => navigate("/app") }}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Preview Settings</Text>
              </InlineStack>
              
              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <Select
                    label="Select Lookbook to preview"
                    options={lookbooks.map((lb: any) => ({ label: lb.title, value: lb.id }))}
                    value={selectedLookbook?.id || ""}
                    onChange={handleLookbookChange}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Select
                    label="Test Layout (does not save)"
                    options={[
                      { label: "Grid", value: "GRID" },
                      { label: "Hero Image", value: "HERO" },
                      { label: "Slideshow", value: "SLIDESHOW" },
                    ]}
                    value={activeLayout}
                    onChange={setActiveLayout}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "16px 0", borderBottom: "1px solid #dfe3e8", marginBottom: "20px" }}>
              <Text variant="headingMd" as="h2">Storefront Preview</Text>
            </div>

            {/* Injected CSS from lookbook.liquid */}
            <style dangerouslySetInnerHTML={{__html: `
              .lb-container {
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                position: relative;
                font-family: inherit;
              }
              .lb-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
              }
              .lb-hero {
                width: 100%;
              }
              .lb-slideshow {
                display: flex;
                overflow-x: auto;
                gap: 20px;
                scroll-snap-type: x mandatory;
              }
              .lb-slideshow .lb-image-wrapper {
                flex: 0 0 100%;
                scroll-snap-align: start;
              }
              .lb-image-wrapper {
                position: relative;
                width: 100%;
              }
              .lb-image-wrapper img {
                width: 100%;
                height: auto;
                display: block;
              }
              .lb-hotspot {
                position: absolute;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                transform: translate(-50%, -50%);
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                transition: transform 0.2s;
                z-index: 10;
              }
              .lb-hotspot:hover {
                transform: translate(-50%, -50%) scale(1.1);
              }
              .lb-popover {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 10px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                width: 200px;
                display: none;
                z-index: 20;
              }
              .lb-hotspot:hover .lb-popover,
              .lb-hotspot:focus .lb-popover {
                display: block;
              }
              .lb-popover img {
                width: 100%;
                height: auto;
                border-radius: 4px;
                margin-bottom: 8px;
              }
              .lb-popover-title {
                font-weight: bold;
                font-size: 14px;
                margin: 0 0 4px 0;
                color: #333;
              }
              .lb-popover-price {
                color: #666;
                font-size: 14px;
                margin: 0 0 8px 0;
              }
              .lb-add-btn {
                width: 100%;
                padding: 8px;
                background: black;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              }
              .lb-add-btn:hover {
                background: #333;
              }
            `}} />

            {/* Preview Render */}
            <div className="lb-container" style={{ backgroundColor: "#fafafa", padding: "20px", border: "1px dashed #ccc" }}>
              {!selectedLookbook ? (
                <Text as="p" tone="subdued">No lookbooks available. Create one first!</Text>
              ) : selectedLookbook.images.length === 0 ? (
                <Text as="p" tone="subdued">This lookbook has no images. Add some images to see the preview.</Text>
              ) : (
                <div className={containerClass}>
                  {selectedLookbook.images.map((image: any) => (
                    <div key={image.id} className="lb-image-wrapper">
                      <img src={image.imageUrl} alt="Lookbook Preview" />
                      {image.pins.map((pin: any) => {
                        const product = productData[pin.productId];
                        if (!product) return null;
                        const price = product.priceRangeV2.minVariantPrice;
                        return (
                          <div 
                            key={pin.id} 
                            className="lb-hotspot" 
                            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%`, backgroundColor: hotspotColor }}
                            tabIndex={0}
                          >
                            <div className="lb-popover">
                              {product.featuredImage?.url && <img src={product.featuredImage.url} alt={product.title} />}
                              <div className="lb-popover-title">{product.title}</div>
                              <div className="lb-popover-price">{formatMoney(price)}</div>
                              <button className="lb-add-btn" onClick={(e) => { e.preventDefault(); alert("Add to cart simulated!"); }}>
                                Add to cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
