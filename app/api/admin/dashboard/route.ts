import { NextResponse } from "next/server";

import { AdminDashboardData } from "@/lib/adminTypes";
import { graphqlRequest } from "@/lib/graphql";

const ADMIN_DASHBOARD_QUERY = /* GraphQL */ `
  query AdminDashboard($limit: Int) {
    adminDashboard(limit: $limit) {
      checkQueries {
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
      }
      myChecks {
        repositoryID
        repositoryName
        checkQueryID
        checkQueryName
        result
        memo
        updatedAt
        isWebApp
      }
      resultOptions
    }
  }
`;

export async function GET() {
  try {
    const data = await graphqlRequest<{
      adminDashboard: AdminDashboardData;
    }>(ADMIN_DASHBOARD_QUERY, { limit: 50 });

    return NextResponse.json(data.adminDashboard);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "管理用データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
