import { GovernanceWorkspaceLoader } from "@/app/admin/governance/governance-workspace-loader";

export default async function AdminGovernanceEnterprisePage() {
  return <GovernanceWorkspaceLoader activeTab="enterprise" />;
}
