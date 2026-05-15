import { GovernanceWorkspaceLoader } from "@/app/admin/governance/governance-workspace-loader";

export default async function AdminGovernanceOverviewPage() {
  return <GovernanceWorkspaceLoader activeTab="overview" />;
}
