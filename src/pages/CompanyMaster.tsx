import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const CompanyMaster = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Company Master"
        description="Manage listed companies (NSE/BSE)"
        action={
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        }
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Company Master CRUD interface - Coming soon
        </div>
      </div>
    </div>
  );
};

export default CompanyMaster;
