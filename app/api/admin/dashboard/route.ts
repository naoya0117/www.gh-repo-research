import { NextResponse } from "next/server";

import { AdminDashboardData } from "@/lib/adminTypes";
import { graphqlRequest } from "@/lib/graphql";

const ADMIN_DASHBOARD_QUERY = /* GraphQL */ `
  query AdminDashboard($limit: Int, $unevaluatedLimit: Int) {
    adminDashboard(limit: $limit) {
      patterns {
        id
        name
        description
        createdAt
      }
      repositories {
        id
        nameWithOwner
        stargazerCount
        primaryLanguage
        hasDockerfile
        createdAt
        isWebApp
        webAppCheckedAt
      }
      checkResults {
        id
        repositoryId
        checkItemId
        result
        memo
        checkedAt
        updatedAt
      }
    }
    unevaluatedRepositoriesWithDockerfile(limit: $unevaluatedLimit) {
      id
      nameWithOwner
      stargazerCount
      primaryLanguage
      hasDockerfile
      createdAt
      isWebApp
      webAppCheckedAt
    }
    evaluatedRepositoriesStats {
      totalCount
      webAppCount
      nonWebAppCount
    }
  }
`;

export async function GET() {
  try {
    const data = await graphqlRequest<{
      adminDashboard: AdminDashboardData;
      unevaluatedRepositoriesWithDockerfile: AdminDashboardData["repositories"];
      evaluatedRepositoriesStats: {
        totalCount: number;
        webAppCount: number;
        nonWebAppCount: number;
      };
    }>(ADMIN_DASHBOARD_QUERY, { limit: 50, unevaluatedLimit: 50 });

    // 未評価リポジトリと統計を追加したレスポンスを作成
    const response = {
      ...data.adminDashboard,
      unevaluatedRepositoriesWithDockerfile: data.unevaluatedRepositoriesWithDockerfile,
      evaluatedRepositoriesStats: data.evaluatedRepositoriesStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "管理用データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
