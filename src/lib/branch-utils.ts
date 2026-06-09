export interface BranchConfig {
  id?: string;
  name: string;
  allowWFH?: boolean;
}

export interface EmployeeBranchInfo {
  branch?: string | null;
  workLocation?: string | null;
}

function findBranchByName(branches: BranchConfig[], name: string) {
  return branches.find((b) => b.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function resolveEmployeeBranch(
  employee: EmployeeBranchInfo,
  branches: BranchConfig[]
): {
  branchName: string | null;
  branch: BranchConfig | null;
  usedFallback: boolean;
} {
  if (employee.branch) {
    const match = findBranchByName(branches, employee.branch);
    return {
      branchName: employee.branch,
      branch: match,
      usedFallback: false,
    };
  }

  if (employee.workLocation) {
    const match = findBranchByName(branches, employee.workLocation);
    if (match) {
      return { branchName: match.name, branch: match, usedFallback: true };
    }
  }

  if (branches.length === 1) {
    return {
      branchName: branches[0].name,
      branch: branches[0],
      usedFallback: true,
    };
  }

  const mainHq = findBranchByName(branches, "Main HQ");
  if (mainHq) {
    return { branchName: mainHq.name, branch: mainHq, usedFallback: true };
  }

  return { branchName: null, branch: null, usedFallback: false };
}

export function isWFHAllowedForBranch(branch: BranchConfig | null): boolean {
  if (!branch) return true;
  return branch.allowWFH !== false;
}

export function getWFHBranchError(
  resolved: ReturnType<typeof resolveEmployeeBranch>
): string | null {
  if (!resolved.branchName) {
    return "You are not assigned to any office branch. Ask your Admin to assign a branch in Team Directory.";
  }
  if (!resolved.branch) {
    return `Your assigned branch "${resolved.branchName}" was not found in system settings.`;
  }
  if (!isWFHAllowedForBranch(resolved.branch)) {
    return `Work From Home (WFH) is not allowed for your branch: ${resolved.branchName}`;
  }
  return null;
}
