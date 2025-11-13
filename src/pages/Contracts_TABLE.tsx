import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, FileText, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { partyQueries, settlementQueries, brokerQueries, contractQueries } from "@/lib/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Party {
  id: string;
  party_code: string;
  name: string;
  trading_slab: number;
  delivery_slab: number;
}

interface Broker {
  id: string;
  broker_code: string;
  name: string;
}

interface Settlement {
  id: string;
  settlement_number: string;
  type: string;
}

interface ContractRow {
  id: string;
  contract_type: "buy" | "sell";
  party_id: string;
  broker_id: string;
  settlement_id: string;
  trade_type: "T" | "D";
  quantity: string;
  rate: string;
  notes: string;
}

const Contracts = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [currentView, setCurrentView] = useState<"entry" | "list">("entry");
  const [savedContracts, setSavedContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [commonFields, setCommonFields] = useState({
    contract_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchParties();
    fetchBrokers();
    fetchSettlements();
    fetchContracts();
    // Add initial empty row
    addRow();
  }, []);

  const fetchParties = async () => {
    try {
      const result = await partyQueries.getAll();
      setParties(result || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({ title: "Error", description: "Failed to fetch parties", variant: "destructive" });
    }
  };

  const fetchBrokers = async () => {
    try {
      const result = await brokerQueries.getAll();
      setBrokers(result || []);
    } catch (error) {
      console.error("Error fetching brokers:", error);
      toast({ title: "Error", description: "Failed to fetch brokers", variant: "destructive" });
    }
  };

  const fetchSettlements = async () => {
    try {
      const result = await settlementQueries.getAll();
      setSettlements(result || []);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      toast({ title: "Error", description: "Failed to fetch settlements", variant: "destructive" });
    }
  };

  const fetchContracts = async () => {
    try {
      const result = await contractQueries.getAll();
      setSavedContracts(result || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  const addRow = () => {
    const newRow: ContractRow = {
      id: Date.now().toString(),
      contract_type: "buy",
      party_id: "",
      broker_id: "",
      settlement_id: "",
      trade_type: "T",
      quantity: "",
      rate: "",
      notes: "",
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast({ title: "Warning", description: "At least one row is required", variant: "destructive" });
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof ContractRow, value: any) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const calculateBrokerage = (row: ContractRow) => {
    if (!row.quantity || !row.rate || !row.party_id) return { rate: 0, amount: 0 };
    
    const party = parties.find((p) => p.id === row.party_id);
    if (!party) return { rate: 0, amount: 0 };

    const quantity = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.rate) || 0;
    const amount = quantity * rate;
    const brokerageRate = row.trade_type === "T" ? party.trading_slab : party.delivery_slab;
    const brokerageAmount = (amount * brokerageRate) / 100;

    return { rate: brokerageRate, amount: brokerageAmount };
  };

  const handleSaveAndGenerateBills = async () => {
    // Validate all rows
    const invalidRows = rows.filter(
      (row) => !row.party_id || !row.broker_id || !row.settlement_id || !row.quantity || !row.rate
    );

    if (invalidRows.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields in all rows",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare contracts data
      const contractsData = rows.map((row) => {
        const party = parties.find((p) => p.id === row.party_id);
        const broker = brokers.find((b) => b.id === row.broker_id);
        const quantity = parseInt(row.quantity);
        const rate = parseFloat(row.rate);
        const amount = quantity * rate;
        const brokerage = calculateBrokerage(row);

        return {
          party_id: row.party_id,
          settlement_id: row.settlement_id,
          broker_id: row.broker_id,
          broker_code: broker?.broker_code,
          contract_date: commonFields.contract_date,
          quantity,
          rate,
          amount,
          contract_type: row.contract_type,
          brokerage_rate: brokerage.rate,
          brokerage_amount: brokerage.amount,
          notes: row.notes || null,
        };
      });

      // Call batch API
      const response = await fetch("http://localhost:3001/api/contracts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contracts: contractsData,
          billDate: commonFields.contract_date,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contracts and bills");
      }

      const result = await response.json();

      toast({
        title: "Success! 🎉",
        description: `Created ${result.contracts.length} contracts, ${result.partyBills.length} party bills, ${result.brokerBills.length} broker bills`,
      });

      // Reset form
      setRows([]);
      addRow();
      fetchContracts();
    } catch (error) {
      console.error("Error creating contracts:", error);
      toast({
        title: "Error",
        description: "Failed to create contracts and generate bills",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEntryView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Contract Entry"
        description="Add multiple contracts and generate bills automatically"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setCurrentView("list")} variant="outline">
              <List className="w-4 h-4 mr-2" />
              View Saved Contracts
            </Button>
            <Button
              onClick={handleSaveAndGenerateBills}
              disabled={isLoading || rows.length === 0}
              className="bg-primary hover:bg-primary-hover"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Save & Generate Bills"}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Common Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contract Date</label>
                <Input
                  type="date"
                  value={commonFields.contract_date}
                  onChange={(e) => setCommonFields({ ...commonFields, contract_date: e.target.value })}
                  className="bg-secondary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Rows Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contract Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[200px]">Party</TableHead>
                    <TableHead className="w-[180px]">Broker</TableHead>
                    <TableHead className="w-[180px]">Settlement</TableHead>
                    <TableHead className="w-[100px]">Trade</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[120px]">Rate</TableHead>
                    <TableHead className="w-[120px]">Amount</TableHead>
                    <TableHead className="w-[100px]">Brokerage</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => {
                    const brokerage = calculateBrokerage(row);
                    const amount = (parseFloat(row.quantity) || 0) * (parseFloat(row.rate) || 0);

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Select
                            value={row.contract_type}
                            onValueChange={(value: "buy" | "sell") => updateRow(row.id, "contract_type", value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">Buy</SelectItem>
                              <SelectItem value="sell">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={row.party_id} onValueChange={(value) => updateRow(row.id, "party_id", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select party" />
                            </SelectTrigger>
                            <SelectContent>
                              {parties.map((party) => (
                                <SelectItem key={party.id} value={party.id}>
                                  {party.party_code} - {party.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={row.broker_id} onValueChange={(value) => updateRow(row.id, "broker_id", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select broker" />
                            </SelectTrigger>
                            <SelectContent>
                              {brokers.map((broker) => (
                                <SelectItem key={broker.id} value={broker.id}>
                                  {broker.broker_code} - {broker.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={row.settlement_id} onValueChange={(value) => updateRow(row.id, "settlement_id", value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {settlements.map((settlement) => (
                                <SelectItem key={settlement.id} value={settlement.id}>
                                  {settlement.settlement_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.trade_type}
                            onValueChange={(value: "T" | "D") => updateRow(row.id, "trade_type", value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="T">T</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                            placeholder="Qty"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.rate}
                            onChange={(e) => updateRow(row.id, "rate", e.target.value)}
                            placeholder="Rate"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          ₹{amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-amber-600">
                          {brokerage.rate}% = ₹{brokerage.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(row.id)}
                            className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button onClick={addRow} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>

              <div className="text-sm text-muted-foreground">
                {rows.length} {rows.length === 1 ? "contract" : "contracts"} • Total: ₹
                {rows
                  .reduce((sum, row) => {
                    const amount = (parseFloat(row.quantity) || 0) * (parseFloat(row.rate) || 0);
                    return sum + amount;
                  }, 0)
                  .toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Saved Contracts"
        description="View all created contracts"
        action={
          <Button onClick={() => setCurrentView("entry")} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        }
      />

      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contract #</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Brokerage</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No contracts found. Create your first contract to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  savedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono">{contract.contract_number}</TableCell>
                      <TableCell>{contract.party_name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            contract.contract_type === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {contract.contract_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{contract.quantity}</TableCell>
                      <TableCell>₹{contract.rate}</TableCell>
                      <TableCell>₹{contract.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-amber-600">₹{contract.brokerage_amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(contract.contract_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return currentView === "entry" ? renderEntryView() : renderListView();
};

export default Contracts;
