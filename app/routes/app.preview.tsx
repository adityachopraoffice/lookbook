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
    hotspotColor: settings?.hotspotColor || "#000000",
    initialLayoutParam: url.searchParams.get("layout")
  });
}

export default function Preview() {
  const { lookbooks, selectedLookbook, productData, hotspotColor, initialLayoutParam } = useLoaderData<any>();
  const submit = useSubmit();
  const navigate = useNavigate();

  // Local state for toggling layout without saving
  const [activeLayout, setActiveLayout] = useState(initialLayoutParam || selectedLookbook?.layout || "GRID");

  useEffect(() => {
    if (initialLayoutParam) {
      setActiveLayout(initialLayoutParam);
    } else if (selectedLookbook) {
      setActiveLayout(selectedLookbook.layout);
    }
  }, [selectedLookbook, initialLayoutParam]);

  useEffect(() => {
    let interval: any;
    if (activeLayout === "SLIDESHOW") {
      interval = setInterval(() => {
        const slideshow = document.querySelector('.lb-slideshow');
        if (slideshow) {
          if (slideshow.scrollLeft + slideshow.clientWidth >= slideshow.scrollWidth - 10) {
            slideshow.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            slideshow.scrollBy({ left: slideshow.clientWidth, behavior: 'smooth' });
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeLayout, selectedLookbook]);

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
  if (activeLayout === "MASONRY") containerClass = "lb-masonry";
  if (activeLayout === "STACK") containerClass = "lb-stack";
  if (activeLayout === "MOSAIC") containerClass = "lb-mosaic";

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
                      { label: "Masonry Grid", value: "MASONRY" },
                      { label: "Vertical Stack", value: "STACK" },
                      { label: "Featured Mosaic", value: "MOSAIC" },
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
              .lb-hero .lb-image-wrapper:not(:first-child) {
                display: none;
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
              .lb-masonry {
                column-count: 3;
                column-gap: 20px;
              }
              @media (max-width: 768px) { .lb-masonry { column-count: 2; } }
              @media (max-width: 480px) { .lb-masonry { column-count: 1; } }
              .lb-masonry .lb-image-wrapper {
                break-inside: avoid;
                margin-bottom: 20px;
              }
              .lb-stack {
                display: flex;
                flex-direction: column;
                gap: 40px;
                align-items: center;
              }
              .lb-stack .lb-image-wrapper {
                max-width: 800px;
              }
              .lb-mosaic {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
              }
              .lb-mosaic .lb-image-wrapper:first-child {
                grid-column: 1 / -1;
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
              {(!selectedLookbook || selectedLookbook.images.length === 0) && (
                <div style={{ marginBottom: "20px" }}>
                  <Text as="p" tone="subdued">You haven't added any images yet. Here is a preview of the layout using sample images.</Text>
                </div>
              )}
              <div className={containerClass}>
                {(selectedLookbook?.images?.length > 0 ? selectedLookbook.images : [
                  { id: "p1", imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80", pins: [] },
                  { id: "p2", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80", pins: [] },
                  { id: "p3", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80", pins: [] },
                  { id: "p4", imageUrl: "https://images.unsplash.com/photo-1485230895905-ef0824b2605f?w=800&q=80", pins: [] },
                ]).map((image: any) => (
                  <div key={image.id} className="lb-image-wrapper">
                    <img src={image.imageUrl} alt="Lookbook Preview" />
                    {image.pins && image.pins.map((pin: any) => {
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
            </div>

          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
