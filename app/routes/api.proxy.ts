import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }: any) {
  const { session, admin } = await authenticate.public.appProxy(request);
  if (!session || !admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const lookbookId = url.searchParams.get("id");

  if (!lookbookId) {
    return json({ error: "Missing lookbook ID" }, { status: 400 });
  }

  const lookbook = await prisma.lookbook.findUnique({
    where: { id: lookbookId, shop: session.shop },
    include: {
      images: {
        orderBy: { position: "asc" },
        include: { pins: true }
      }
    }
  });

  if (!lookbook || lookbook.status !== "PUBLISHED") {
    return json({ error: "Lookbook not found or not published" }, { status: 404 });
  }

  const settings = await prisma.shopSettings.findUnique({ where: { shop: session.shop } });
  const hotspotColor = settings?.hotspotColor || "#000000";

  // Fetch product data for all pins
  const productGids = new Set<string>();
  lookbook.images.forEach(img => {
    img.pins.forEach(pin => productGids.add(pin.productId));
  });

  const productData: Record<string, any> = {};

  if (productGids.size > 0) {
    // We can fetch them in a batch or loop (loop is fine for MVP)
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
      } catch (e) {
        console.error("Failed to fetch product", gid);
      }
    }
  }

  return json({ lookbook, productData, hotspotColor }, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }
  });
}
