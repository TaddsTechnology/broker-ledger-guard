import { PageHeader } from "@/components/PageHeader";

const Ledger = () => {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Ledger"
        description="Account ledger and transaction history"
      />
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Ledger interface - Coming soon
        </div>
      </div>
    </div>
  );
};

export default Ledger;
