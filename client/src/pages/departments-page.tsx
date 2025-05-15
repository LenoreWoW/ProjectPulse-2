import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Department, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Pencil, 
  User as UserIcon, 
  Building,
  Phone,
  Mail,
  Search,
  Users,
  CircleCheckBig
} from "lucide-react";

export default function DepartmentsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Department form state
  const [formState, setFormState] = useState({
    name: "",
    nameAr: "",
    directorUserId: 0,
  });
  
  // Query for departments
  const { 
    data: departments = [], 
    isLoading: isLoadingDepartments,
    isError: isDepartmentsError
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Query for users for director selection
  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Mutation for creating a department
  const createDepartmentMutation = useMutation({
    mutationFn: async (department: { name: string; nameAr: string; directorUserId: number }) => {
      const response = await apiRequest("POST", "/api/departments", department);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: t("departmentCreated"),
        description: t("departmentCreatedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("departmentCreationFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a department
  const updateDepartmentMutation = useMutation({
    mutationFn: async (department: { id: number; name: string; nameAr: string; directorUserId: number }) => {
      const response = await apiRequest("PATCH", `/api/departments/${department.id}`, department);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
      toast({
        title: t("departmentUpdated"),
        description: t("departmentUpdatedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("departmentUpdateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.name || !formState.nameAr) {
      toast({
        title: t("validationError"),
        description: t("allFieldsRequired"),
        variant: "destructive",
      });
      return;
    }
    
    if (isEditDialogOpen && editingDepartment) {
      updateDepartmentMutation.mutate({ 
        id: editingDepartment.id, 
        ...formState 
      });
    } else {
      createDepartmentMutation.mutate(formState);
    }
  };
  
  // Reset form state
  const resetForm = () => {
    setFormState({
      name: "",
      nameAr: "",
      directorUserId: 0,
    });
  };
  
  // Handle edit button click
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormState({
      name: department.name,
      nameAr: department.nameAr,
      directorUserId: department.directorUserId || 0,
    });
    setIsEditDialogOpen(true);
  };
  
  // Find department director info
  const getDirectorInfo = (directorUserId: number | null) => {
    if (!directorUserId) return { name: t("notAssigned"), email: "" };
    const director = users.find(user => user.id === directorUserId);
    return director 
      ? { name: director.name, email: director.email } 
      : { name: t("notAssigned"), email: "" };
  };
  
  // Filter departments based on search term
  const filteredDepartments = departments.filter(
    department => 
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.nameAr.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Check if user is allowed to manage departments
  const canManageDepartments = ["Administrator", "MainPMO"].includes(user?.role || "");
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("departments")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("departmentsDescription")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("searchDepartments")}
              className="pl-10 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {canManageDepartments && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-qatar-maroon hover:bg-maroon-800">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addDepartment")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addNewDepartment")}</DialogTitle>
                  <DialogDescription>
                    {t("addDepartmentDescription")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t("departmentName")}</Label>
                      <Input
                        id="name"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder={t("enterDepartmentName")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nameAr">{t("departmentNameAr")}</Label>
                      <Input
                        id="nameAr"
                        value={formState.nameAr}
                        onChange={(e) => setFormState({ ...formState, nameAr: e.target.value })}
                        placeholder={t("enterDepartmentNameAr")}
                        dir="rtl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="directorUserId">{t("departmentDirector")}</Label>
                      <select
                        id="directorUserId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formState.directorUserId}
                        onChange={(e) => setFormState({ ...formState, directorUserId: parseInt(e.target.value) })}
                      >
                        <option value={0}>{t("selectDirector")}</option>
                        {users
                          .filter(u => ["DepartmentDirector"].includes(u.role))
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800">
                      {t("addDepartment")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editDepartment")}</DialogTitle>
                <DialogDescription>
                  {t("editDepartmentDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">{t("departmentName")}</Label>
                    <Input
                      id="edit-name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder={t("enterDepartmentName")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-nameAr">{t("departmentNameAr")}</Label>
                    <Input
                      id="edit-nameAr"
                      value={formState.nameAr}
                      onChange={(e) => setFormState({ ...formState, nameAr: e.target.value })}
                      placeholder={t("enterDepartmentNameAr")}
                      dir="rtl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-directorUserId">{t("departmentDirector")}</Label>
                    <select
                      id="edit-directorUserId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formState.directorUserId}
                      onChange={(e) => setFormState({ ...formState, directorUserId: parseInt(e.target.value) })}
                    >
                      <option value={0}>{t("selectDirector")}</option>
                      {users
                        .filter(u => ["DepartmentDirector"].includes(u.role))
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingDepartment(null);
                      resetForm();
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800">
                    {t("updateDepartment")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoadingDepartments ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
        </div>
      ) : isDepartmentsError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 dark:text-gray-400">{t("errorLoadingDepartments")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/departments"] })}
            >
              {t("tryAgain")}
            </Button>
          </CardContent>
        </Card>
      ) : filteredDepartments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{t("noDepartmentsFound")}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t("createDepartmentToStart")}</p>
            {canManageDepartments && (
              <Button
                className="mt-4 bg-qatar-maroon hover:bg-maroon-800"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addDepartment")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("departmentName")}</TableHead>
                <TableHead>{t("arabicName")}</TableHead>
                <TableHead>{t("director")}</TableHead>
                <TableHead>{t("contactInfo")}</TableHead>
                {canManageDepartments && <TableHead className="text-right">{t("actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => {
                const director = getDirectorInfo(department.directorUserId);
                return (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell dir="rtl">{department.nameAr}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span>{director.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {director.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{director.email}</span>
                        </div>
                      )}
                    </TableCell>
                    {canManageDepartments && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(department)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t("edit")}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Department Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("totalDepartments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <Building className="h-8 w-8 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">{departments.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("totalDirectors")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <UserIcon className="h-8 w-8 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">
                {departments.filter(d => d.directorUserId !== null).length}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("departmentsWithProjects")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <CircleCheckBig className="h-8 w-8 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">
                {/* This would need to be calculated based on projects data */}
                {departments.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}