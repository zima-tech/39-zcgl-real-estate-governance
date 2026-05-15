import {
  GovernanceWorkspacePage,
  type GovernanceWorkspaceTabKey,
} from "@/app/admin/_components/governance-workspace-page";
import {
  getEnterpriseGovernanceAnalysis,
  getGovernanceHomepageOverview,
  getGovernanceDashboard,
  getRealEstateAssetLedger,
  governanceProcessors,
  governanceScenarioBundles,
  listGovernanceRecords,
  listGovernanceScenarioRuns,
  listGovernanceTemplates,
  listGovernanceWarnings,
  listPendingGovernanceTasks,
} from "@/lib/admin/governance-service";

export async function GovernanceWorkspaceLoader({
  activeTab,
}: {
  activeTab: GovernanceWorkspaceTabKey;
}) {
  const [
    initialRecords,
    initialDashboard,
    initialAssetLedger,
    initialEnterpriseAnalysis,
    initialHomepageOverview,
    initialTemplates,
    initialWarnings,
    initialWorkflowTasks,
    initialScenarioRuns,
  ] = await Promise.all([
    listGovernanceRecords(),
    getGovernanceDashboard(),
    getRealEstateAssetLedger(),
    getEnterpriseGovernanceAnalysis(),
    getGovernanceHomepageOverview(),
    listGovernanceTemplates(),
    listGovernanceWarnings(),
    listPendingGovernanceTasks(),
    listGovernanceScenarioRuns(),
  ]);

  return (
    <GovernanceWorkspacePage
      initialActiveTab={activeTab}
      initialAssetLedger={initialAssetLedger}
      initialDashboard={initialDashboard}
      initialEnterpriseAnalysis={initialEnterpriseAnalysis}
      initialHomepageTodos={initialHomepageOverview.todos}
      initialProcessors={governanceProcessors}
      initialRecords={initialRecords}
      initialScenarioBundles={Object.entries(governanceScenarioBundles).map(
        ([key, bundle]) => ({
          key,
          label: bundle.label,
          steps: bundle.steps,
        }),
      )}
      initialScenarioRuns={initialScenarioRuns}
      initialTemplates={initialTemplates}
      initialWarnings={initialWarnings}
      initialWorkflowTasks={initialWorkflowTasks}
    />
  );
}
