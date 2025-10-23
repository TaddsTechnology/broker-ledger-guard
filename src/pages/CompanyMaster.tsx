import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Save, X, List, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormNavigation, useBusinessKeyboard } from "@/hooks/useBusinessKeyboard";
import { companyQueries } from "@/lib/database";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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

interface Company {
  id: string;
  company_code: string;
  name: string;
  nse_code: string | null;
  created_at: string;
  updated_at: string;
}

const CompanyMaster = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const { toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    company_code: "",
    name: "",
    nse_code: "",
  });

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await companyQueries.getAll();
      setCompanies(result || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
    
    // Check if we should auto-open the form (e.g., when navigating with Enter from sidebar)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setCurrentView('form');
      resetForm();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchCompanies]);

  // Filter companies based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(
        (company) =>
          company.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (company.nse_code && company.nse_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCompanies(filtered);
    }
    setSelectedRowIndex(0);
  }, [companies, searchTerm]);

  // Focus first input when form view opens
  useEffect(() => {
    if (currentView === 'form' && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [currentView]);

  // Scroll to selected row when index changes
  useEffect(() => {
    if (currentView === 'list' && filteredCompanies.length > 0) {
      const selectedRow = document.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowIndex, currentView, filteredCompanies.length]);

  const resetForm = () => {
    setFormData({
      company_code: "",
      name: "",
      nse_code: "",
    });
    setEditingCompany(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.company_code.trim() || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company code and name are required",
        variant: "destructive",
      });
      return;
    }

    const companyData = {
      company_code: formData.company_code.trim().toUpperCase(),
      name: formData.name.trim(),
      nse_code: formData.nse_code.trim().toUpperCase() || null,
    };

    try {
      if (editingCompany) {
        await companyQueries.update(editingCompany.id, companyData);
        toast({ title: "Success", description: "Company updated successfully" });
        setCurrentView('list');
        resetForm();
        fetchCompanies();
      } else {
        await companyQueries.create(companyData);
        toast({ 
          title: "Success", 
          description: "Company created successfully",
          variant: "default"
        });
        resetForm();
        
        // Show success message and ask if user wants to continue
        toast({
          title: "Add Another?",
          description: "Company created successfully! Would you like to add another company?",
          action: (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCurrentView('list');
                  toast({ title: "Switched to list view" });
                }}
              >
                View List
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Stay in form for next entry
                  toast({ title: "Ready for next entry" });
                }}
              >
                Add Another
              </Button>
            </div>
          ),
        });
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Error",
        description: "Failed to save company",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      company_code: company.company_code,
      name: company.name,
      nse_code: company.nse_code || "",
    });
    setCurrentView('form');
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      await companyQueries.delete(companyToDelete.id);
      toast({ 
        title: "Success", 
        description: `Company "${companyToDelete.name}" deleted successfully`,
        variant: "default"
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  // Business keyboard shortcuts
  useBusinessKeyboard({
    onNew: () => {
      resetForm();
      setCurrentView('form');
    },
    onEdit: () => {
      if (currentView === 'list' && filteredCompanies[selectedRowIndex]) {
        handleEdit(filteredCompanies[selectedRowIndex]);
      }
    },
    onDelete: () => {
      if (currentView === 'list' && filteredCompanies[selectedRowIndex]) {
        handleDelete(filteredCompanies[selectedRowIndex]);
      }
    },
    onSearch: () => {
      if (currentView === 'list') {
        searchInputRef.current?.focus();
      }
    },
    onSave: () => {
      if (currentView === 'form') {
        handleSubmit();
      }
    },
    onCancel: () => {
      if (currentView === 'form') {
        setCurrentView('list');
        resetForm();
      }
    },
    onUp: () => {
      if (currentView === 'list' && filteredCompanies.length > 0) {
        const prevIndex = Math.max(selectedRowIndex - 1, 0);
        setSelectedRowIndex(prevIndex);
      }
    },
    onDown: () => {
      if (currentView === 'list' && filteredCompanies.length > 0) {
        const nextIndex = Math.min(selectedRowIndex + 1, filteredCompanies.length - 1);
        setSelectedRowIndex(nextIndex);
      }
    },
  });

  // Form navigation
  useFormNavigation(formRef, handleSubmit);

  // Render form view
  const renderFormView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title={editingCompany ? "Edit Company" : "Company Master - New Entry"}
        description={editingCompany ? "Update company information" : "Create new listed company entry"}
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCurrentView('list');
                resetForm();
              }}
              className="btn-secondary group relative"
            >
              <List className="w-4 h-4 mr-2" />
              View List
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                Esc
              </kbd>
            </Button>
            <Button
              onClick={handleSubmit}
              className="btn-primary group relative"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingCompany ? "Update" : "Save"}
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F9
              </kbd>
            </Button>
          </div>
        }
      />
      
      <div className="spacing-lg">
        <form ref={formRef} onSubmit={handleSubmit} className="form-clean">
          {/* Company Information */}
          <div className="card-clean">
            <div className="header-clean">
              <h3 className="text-lg flex items-center gap-2 text-clean">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                Company Information
              </h3>
            </div>
            <div className="spacing-lg">
              <div className="form-clean">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <Label htmlFor="company_code" className="form-clean label">
                      Company Code <span className="text-primary">*</span>
                    </Label>
                    <Input
                      ref={firstInputRef}
                      id="company_code"
                      value={formData.company_code}
                      onChange={(e) => setFormData({ ...formData, company_code: e.target.value.toUpperCase() })}
                      required
                      className="input-clean h-10 uppercase focus-clean"
                      placeholder="e.g., TCS, INFY"
                      maxLength={50}
                      tabIndex={1}
                    />
                  </div>
                  
                  <div className="form-group">
                    <Label htmlFor="nse_code" className="form-clean label">
                      NSE Code
                    </Label>
                    <Input
                      id="nse_code"
                      value={formData.nse_code}
                      onChange={(e) => setFormData({ ...formData, nse_code: e.target.value.toUpperCase() })}
                      className="input-clean h-10 uppercase focus-clean"
                      placeholder="NSE trading symbol"
                      maxLength={50}
                      tabIndex={3}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <Label htmlFor="name" className="form-clean label">
                    Company Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-clean h-10 focus-clean"
                    placeholder="Full company name"
                    tabIndex={2}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentView('list');
                resetForm();
              }}
              className="px-6"
              tabIndex={5}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel <kbd className="ml-2 text-xs opacity-50">Esc</kbd>
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-hover px-6"
              tabIndex={4}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingCompany ? "Update" : "Save"} <kbd className="ml-2 text-xs opacity-50">F9</kbd>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Company Master"
        description="Manage listed company information and NSE codes"
        action={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search companies... (F3)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-clean pl-8 w-64 focus-clean"
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setCurrentView('form');
              }}
              className="btn-primary group relative"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
              <kbd className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                F4
              </kbd>
            </Button>
          </div>
        }
      />

      <div className="spacing-lg">
        <div className="card-clean overflow-hidden">
          <Table className="table-clean">
            <TableHeader>
              <TableRow>
                <TableHead>Company Code</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>NSE Code</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading companies...
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? `No companies found matching "${searchTerm}"` : "No companies found. Add your first company to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company, index) => (
                  <TableRow 
                    key={company.id} 
                    data-row-index={index}
                    className={`hover-clean cursor-pointer transition-colors ${
                      index === selectedRowIndex ? "bg-primary/10 ring-2 ring-primary/20" : ""
                    }`}
                    onClick={(e) => {
                      setSelectedRowIndex(index);
                      // Auto-focus the row for keyboard navigation
                      const rowElement = e.currentTarget;
                      rowElement.focus();
                    }}
                    onDoubleClick={() => handleEdit(company)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEdit(company);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = Math.min(selectedRowIndex + 1, filteredCompanies.length - 1);
                        setSelectedRowIndex(nextIndex);
                        // Focus the next row
                        const nextRow = e.currentTarget.parentElement?.children[nextIndex] as HTMLElement;
                        nextRow?.focus();
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const prevIndex = Math.max(selectedRowIndex - 1, 0);
                        setSelectedRowIndex(prevIndex);
                        // Focus the previous row
                        const prevRow = e.currentTarget.parentElement?.children[prevIndex] as HTMLElement;
                        prevRow?.focus();
                      } else if (e.key === "Home") {
                        e.preventDefault();
                        setSelectedRowIndex(0);
                        const firstRow = e.currentTarget.parentElement?.children[0] as HTMLElement;
                        firstRow?.focus();
                      } else if (e.key === "End") {
                        e.preventDefault();
                        const lastIndex = filteredCompanies.length - 1;
                        setSelectedRowIndex(lastIndex);
                        const lastRow = e.currentTarget.parentElement?.children[lastIndex] as HTMLElement;
                        lastRow?.focus();
                      }
                    }}
                  >
                    <TableCell className="font-mono text-sm font-medium">{company.company_code}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="font-mono text-sm">{company.nse_code || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(company);
                          }}
                          className="hover-clean hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company);
                          }}
                          className="hover-clean hover:text-primary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredCompanies.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCompanies.length} of {companies.length} companies
            {searchTerm && ` • Filtered by "${searchTerm}"`}
            • Selected: {selectedRowIndex + 1}
          </div>
        )}
      </div>
    </div>
  );

  // Main render based on current view
  return (
    <>
      {currentView === 'form' ? renderFormView() : renderListView()}
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Company"
        description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
};

export default CompanyMaster;
