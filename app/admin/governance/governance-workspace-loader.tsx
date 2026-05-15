import {
  GovernanceWorkspacePage,
  type GovernanceWorkspaceTabKey,
} from "@/app/admin/_components/governance-workspace-page";
import {
  getGovernanceDashboard,
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
    initialTemplates,
    initialWarnings,
    initialWorkflowTasks,
    initialScenarioRuns,
  ] = await Promise.all([
    listGovernanceRecords(),
    getGovernanceDashboard(),
    listGovernanceTemplates(),
    listGovernanceWarnings(),
    listPendingGovernanceTasks(),
    listGovernanceScenarioRuns(),
  ]);

  return (
    <GovernanceWorkspacePage
      initialActiveTab={activeTab}
      initialDashboard={initialDashboard}
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
