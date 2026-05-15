import { GovernanceWorkspaceLoader } from "@/app/admin/governance/governance-workspace-loader";

export default async function AdminGovernancePage() {
  return <GovernanceWorkspaceLoader activeTab="records" />;
}
