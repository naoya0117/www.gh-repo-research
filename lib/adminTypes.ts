export type K8sPattern = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type CheckItem = {
  id: number;
  patternId: number;
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
  isWebApp?: boolean | null;
  webAppCheckedAt?: string | null;
};

export type CheckResult = {
  id: number;
  repositoryId: number;
  checkItemId: number;
  result: boolean;
  memo?: string | null;
  checkedAt: string;
  updatedAt: string;
};

export type EvaluatedRepositoriesStats = {
  totalCount: number;
  webAppCount: number;
  nonWebAppCount: number;
};

export type AdminDashboardData = {
  patterns: K8sPattern[];
  repositories: Repository[];
  checkResults: CheckResult[];
  unevaluatedRepositoriesWithDockerfile?: Repository[];
  evaluatedRepositoriesStats?: EvaluatedRepositoriesStats;
};
