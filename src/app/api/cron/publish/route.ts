import { NextRequest, NextResponse } from "next/server";
import { restProcessScheduledPublications } from "@/lib/serverFirestoreRest";

export async function GET(request: NextRequest) {
  return handlePublishCron(request);
}

export async function POST(request: NextRequest) {
  return handlePublishCron(request);
}

async function handlePublishCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  // Authorize caller via secret header or query param
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const urlSecret = request.nextUrl.searchParams.get("secret");

  const providedSecret = 
    cronSecretHeader || 
    urlSecret || 
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  const isAuthorized = 
    (providedSecret && providedSecret === cronSecret) ||
    request.headers.get("user-agent")?.includes("vercel-cron");

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret" },
      { status: 401 }
    );
  }

  try {
    const result = await restProcessScheduledPublications();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Scheduled publishing error:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled publications", details: error.message },
      { status: 500 }
    );
  }
}
