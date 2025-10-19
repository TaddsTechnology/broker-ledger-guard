import { PageHeader } from "@/components/PageHeader";

const DataManagement = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Data Management"
        description="Backup, restore, and manage system data"
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Data management tools - Coming soon
        </div>
      </div>
    </div>
  );
};

export default DataManagement;