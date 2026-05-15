import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import {
  governanceScenarioBundles,
  listGovernanceScenarioRuns,
  startGovernanceScenarioRun,
} from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const runs = await listGovernanceScenarioRuns();
    const bundles = Object.entries(governanceScenarioBundles).map(
      ([key, bundle]) => ({
        key,
        label: bundle.label,
        steps: bundle.steps,
      }),
    );

    return NextResponse.json({ bundles, runs });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理场景失败。");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const body = (await request.json().catch(() => null)) as {
      bundleKey?: string;
    } | null;
    const payload = await startGovernanceScenarioRun(
      body?.bundleKey ?? "",
      session.user,
      request,
    );

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "启动治理场景失败。");
  }
}
