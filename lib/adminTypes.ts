export type CheckQuery = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type Repository = {
  id: number;
  nameWithOwner: string;
  stargazerCount: number;
  primaryLanguage?: string | null;
  hasDockerfile: boolean;
  createdAt: string;
};

export type MyCheck = {
  repositoryID: number;
  repositoryName: string;
  checkQueryID: number;
  checkQueryName: string;
  result: string;
  memo?: string | null;
  updatedAt: string;
  isWebApp?: boolean | null;
};

export type AdminDashboardData = {
  checkQueries: CheckQuery[];
  repositories: Repository[];
  myChecks: MyCheck[];
  resultOptions: string[];
};

export const DEFAULT_RESULT_OPTIONS = ["○", "×", "△"] as const;
