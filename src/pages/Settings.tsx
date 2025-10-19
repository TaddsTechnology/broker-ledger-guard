import { PageHeader } from "@/components/PageHeader";

const Settings = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Application Settings"
        description="Configure system settings and preferences"
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Application settings interface - Coming soon
        </div>
      </div>
    </div>
  );
};

export default Settings;