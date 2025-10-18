import { PageHeader } from "@/components/PageHeader";

const Bills = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Bills"
        description="Generate and manage billing"
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Billing interface - Coming soon
        </div>
      </div>
    </div>
  );
};

export default Bills;
