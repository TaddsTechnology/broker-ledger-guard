import { PageHeader } from "@/components/PageHeader";

const Reports = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Reports"
        description="Analytics and business intelligence"
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Reports & analytics - Coming soon
        </div>
      </div>
    </div>
  );
};

export default Reports;
