import { json } from "@remix-run/node";
import prisma from "../db.server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function action({ request }: any) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await request.json();
    const { action, lookbookId, pinId } = data;

    if (action === "view" && lookbookId) {
      await (prisma.lookbook as any).update({
        where: { id: lookbookId },
        data: { views: { increment: 1 } },
      });
    } else if (action === "click" && lookbookId && pinId) {
      await prisma.$transaction([
        (prisma.lookbook as any).update({
          where: { id: lookbookId },
          data: { clicks: { increment: 1 } },
        }),
        (prisma.pin as any).update({
          where: { id: pinId },
          data: { clicks: { increment: 1 } },
        }),
      ]);
    }

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Analytics Error:", error);
    return json({ success: false, error: String(error) }, { status: 500, headers: corsHeaders });
  }
}
