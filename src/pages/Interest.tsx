import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, TrendingUp, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Party {
  id: string;
  party_code: string;
  name: string;
  interest_rate: number;
}

interface DailyInterest {
  date: string;
  owed_amount: number;
  closing_balance: number;
}

interface InterestCalculation {
  party_id: string;
  party_code: string;
  party_name: string;
  interest_rate: number;
  total_days: number;
  total_owed_sum: number;
  average_daily_owed_balance: number;
  total_interest: number;
  daily_breakdown: DailyInterest[];
}

const Interest = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  ); // First day of current month
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  ); // Today
  const [interestData, setInterestData] = useState<InterestCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedParties, setExpandedParties] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/parties");
      const result = await response.json();
      // Only show parties with interest_rate > 0
      const partiesWithInterest = result.filter(
        (p: Party) => Number(p.interest_rate) > 0
      );
      setParties(partiesWithInterest || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const calculateInterest = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Validation Error",
        description: "Please select both From and To dates",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let url = `http://localhost:3001/api/interest?from_date=${fromDate}&to_date=${toDate}&module=fo`;
      if (selectedPartyId && selectedPartyId !== "all") {
        url += `&party_id=${selectedPartyId}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.data) {
        setInterestData(result.data);
        if (result.data.length === 0) {
          toast({
            title: "No Data",
            description:
              "No interest calculations found for the selected criteria",
          });
        }
      } else {
        setInterestData([]);
        toast({
          title: "Info",
          description: result.message || "No interest data found",
        });
      }
    } catch (error) {
      console.error("Error calculating interest:", error);
      toast({
        title: "Error",
        description: "Failed to calculate interest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePartyExpansion = (partyId: string) => {
    setExpandedParties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(partyId)) {
        newSet.delete(partyId);
      } else {
        newSet.add(partyId);
      }
      return newSet;
    });
  };

  const totalInterest = interestData.reduce(
    (sum, party) => sum + party.total_interest,
    0
  );

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Interest Management"
        description="Calculate interest on outstanding balances for parties"
        action={null}
      />

      <div className="p-6 space-y-6">
        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Interest Calculation Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_date">From Date</Label>
                <Input
                  id="from_date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_date">To Date</Label>
                <Input
                  id="to_date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="party">Party (Optional)</Label>
                <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="All Parties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.party_code} - {party.name} ({party.interest_rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={calculateInterest}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {isLoading ? "Calculating..." : "Calculate Interest"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        {interestData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Parties</p>
                    <p className="text-2xl font-bold">{interestData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-2xl font-bold">
                      ₹{totalInterest.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="text-sm font-semibold">
                      {new Date(fromDate).toLocaleDateString()} -{" "}
                      {new Date(toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Interest Data Table */}
        {interestData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Interest Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Party</TableHead>
                      <TableHead className="font-semibold text-right">
                        Interest Rate
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Total Days
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        ADB
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Total Interest
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interestData.map((party) => {
                      const isExpanded = expandedParties.has(party.party_id);
                      return (
                        <React.Fragment key={party.party_id}>
                          {/* Party Summary Row */}
                          <TableRow
                            className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium"
                            onClick={() => togglePartyExpansion(party.party_id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{isExpanded ? "▼" : "▶"}</span>
                                <div>
                                  <div className="font-bold">{party.party_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {party.party_name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {party.interest_rate}%
                            </TableCell>
                            <TableCell className="text-right">
                              {party.total_days} days
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{party.average_daily_owed_balance.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-lg font-bold text-green-600">
                              ₹{party.total_interest.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePartyExpansion(party.party_id);
                                }}
                              >
                                {isExpanded ? "Collapse" : "View Details"}
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Daily Breakdown */}
                          {isExpanded &&
                            party.daily_breakdown.map((daily, index) => (
                              <TableRow
                                key={`${party.party_id}-${index}`}
                                className="bg-gray-50"
                              >
                                <TableCell className="pl-12" colSpan={2}>
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {new Date(daily.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="text-sm text-muted-foreground">
                                    Closing Balance
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="text-sm font-mono">
                                    ₹{Number(daily.closing_balance).toFixed(2)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-amber-600">
                                  {daily.owed_amount > 0 ? (
                                    <span>Owed: ₹{daily.owed_amount.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-green-600">No debt</span>
                                  )}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && interestData.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Interest Data</h3>
              <p className="text-muted-foreground mb-4">
                Select date range and click "Calculate Interest" to view interest
                calculations
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Interest;
