import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Department, User } from "@/lib/schema-types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  FormRoot,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-wrapper";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Users, 
  Search, 
  Plus, 
  Pencil, 
  Trash, 
  User as UserIcon,
  MoreHorizontal
} from "lucide-react";
import { PermissionGate } from "@/hooks/use-permissions";

// Form schema for adding or editing departments
const departmentFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  headUserId: z.number().optional().nullable(),
  budget: z.number().optional().nullable(),
  code: z.string().min(2, { message: "Code must be at least 2 characters." }),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function DepartmentsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Check if current user has permission to manage departments
  const canManageDepartments = user?.roles?.some((role: string) => ["Administrator", "MainPMO"].includes(role)) || false;
  
  // Fetch departments
  const { 
    data: departments = [], 
    isLoading: isLoadingDepartments,
    isError: isDepartmentsError,
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Fetch users for department head selection
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Define form with react-hook-form and zod validation
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      headUserId: null,
      budget: null,
      code: "",
      location: null,
      phone: null,
      email: null,
    },
  });
  
  // Reset form when adding a new department
  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      headUserId: null,
      budget: null,
      code: "",
      location: null,
      phone: null,
      email: null,
    });
  };
  
  // Set form values when editing a department
  const setFormForEditing = (department: Department) => {
    form.reset({
      name: department.name,
      description: department.description || "",
      headUserId: department.headUserId,
      budget: department.budget,
      code: department.code || "",
      location: department.location || "",
      phone: department.phone || "",
      email: department.email || "",
    });
  };
  
  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const response = await apiRequest("POST", "/api/departments", values);
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
  
  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: DepartmentFormValues }) => {
      const response = await apiRequest("PATCH", `/api/departments/${id}`, values);
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
  
  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/departments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: t("departmentDeleted"),
        description: t("departmentDeletedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("departmentDeletionFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: DepartmentFormValues) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, values });
    } else {
      createDepartmentMutation.mutate(values);
    }
  };
  
  // Handle view department details
  const handleViewDetails = (department: Department) => {
    setViewingDepartment(department);
  };
  
  // Handle edit button click
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormForEditing(department);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (department: Department) => {
    if (window.confirm(t("confirmDepartmentDeletion"))) {
      deleteDepartmentMutation.mutate(department.id);
    }
  };
  
  // Filter departments based on search term
  const filteredDepartments = departments.filter(
    (department) =>
      department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
  );

  // Get department head name
  const getDepartmentHeadName = (headUserId: number | null) => {
    if (!headUserId) return t("notAssigned");
    const head = users.find((user) => user.id === headUserId);
    return head ? head.name : t("notAssigned");
  };
  
  // Get department members
  const getDepartmentMembers = (departmentId: number) => {
    return users.filter((user) => user.departmentId === departmentId);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-contrast dark:text-white">{t("departments")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("manageDepartments")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("searchDepartments")}
              className="pl-10 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {canManageDepartments && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="text-white font-medium"
                  style={{ backgroundColor: '#8a1538' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addDepartment")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("addNewDepartment")}</DialogTitle>
                  <DialogDescription>
                    {t("addDepartmentDescription")}
                  </DialogDescription>
                </DialogHeader>
                <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("name")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("enterDepartmentName")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("code")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("enterDepartmentCode")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("description")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder={t("enterDepartmentDescription")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="headUserId"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>{t("departmentHead")}</FormLabel>
                            <Select 
                              onValueChange={(value: string) => field.onChange(value === "none" ? null : parseInt(value))} 
                              defaultValue={field.value?.toString() || "none"}
                              value={field.value?.toString() || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectDepartmentHead")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{t("notAssigned")}</SelectItem>
                                {users
                                  .filter((u) => u.role?.includes("DepartmentDirector") || u.role?.includes("Executive"))
                                  .map((user) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>{t("budget")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                {...field}
                                value={field.value === null || field.value === undefined ? '' : field.value}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? null : parseFloat(value));
                                }}
                                placeholder={t("enterBudget")} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>{t("location")}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ""} placeholder={t("enterLocation")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>{t("phone")}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ""} placeholder={t("enterPhone")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" value={field.value ?? ""} placeholder={t("enterEmail")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          resetForm();
                        }}
                      >
                        {t("cancel")}
                      </Button>
                      <Button 
                        type="submit" 
                        className="text-white font-medium"
                        style={{ backgroundColor: '#8a1538' }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
                      >
                        {t("addDepartment")}
                      </Button>
                    </DialogFooter>
                </FormRoot>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Edit Department Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("editDepartment")}</DialogTitle>
                <DialogDescription>
                  {t("editDepartmentDescription")}
                </DialogDescription>
              </DialogHeader>
              <FormRoot form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("enterDepartmentName")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>{t("code")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("enterDepartmentCode")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t("enterDepartmentDescription")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="headUserId"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("departmentHead")}</FormLabel>
                          <Select 
                            onValueChange={(value: string) => field.onChange(value === "none" ? null : parseInt(value))} 
                            defaultValue={field.value?.toString() || "none"}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectDepartmentHead")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t("notAssigned")}</SelectItem>
                              {users
                                .filter((u) => u.role?.includes("DepartmentDirector") || u.role?.includes("Executive"))
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("budget")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              value={field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? null : parseFloat(value));
                              }}
                              placeholder={t("enterBudget")} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("location")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder={t("enterLocation")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>{t("phone")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder={t("enterPhone")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" value={field.value ?? ""} placeholder={t("enterEmail")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                    <Button 
                      type="submit" 
                      className="text-white font-medium"
                      style={{ backgroundColor: '#8a1538' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
                    >
                      {t("updateDepartment")}
                    </Button>
                  </DialogFooter>
              </FormRoot>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Detail View Dialog */}
      {viewingDepartment && (
        <Dialog open={Boolean(viewingDepartment)} onOpenChange={(open) => !open && setViewingDepartment(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{viewingDepartment.name}</DialogTitle>
              <Badge variant="outline" className="self-start mt-2 text-xs font-medium">
                {viewingDepartment.code}
              </Badge>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t("description")}</h3>
                  <p>{viewingDepartment.description || t("noDepartmentDescription")}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t("departmentHead")}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-maroon-100 dark:bg-maroon-900 flex items-center justify-center text-qatar-maroon">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span>{getDepartmentHeadName(viewingDepartment.headUserId || null)}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t("budget")}</h3>
                  <p className="text-lg font-semibold">
                    {viewingDepartment.budget ? `$${viewingDepartment.budget.toLocaleString()}` : t("notAssigned")}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t("contactInformation")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{t("location")}:</span>
                      <span>{viewingDepartment.location || t("notProvided")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{t("phone")}:</span>
                      <span>{viewingDepartment.phone || t("notProvided")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 dark:text-gray-300">{t("email")}:</span>
                      <span>{viewingDepartment.email || t("notProvided")}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1">{t("stats")}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center">
                        <Users className="h-6 w-6 text-qatar-maroon mb-1" />
                        <span className="text-sm text-gray-500">{t("members")}</span>
                        <span className="text-xl font-bold">{getDepartmentMembers(viewingDepartment.id).length}</span>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center">
                        <Building className="h-6 w-6 text-qatar-maroon mb-1" />
                        <span className="text-sm text-gray-500">{t("projects")}</span>
                        <span className="text-xl font-bold">
                          {/* Placeholder for project count */}
                          {Math.floor(Math.random() * 10)}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-3">{t("members")}</h3>
                <div className="max-h-60 overflow-y-auto pr-2">
                  {getDepartmentMembers(viewingDepartment.id).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">{t("noMembers")}</p>
                  ) : (
                    <div className="space-y-3">
                      {getDepartmentMembers(viewingDepartment.id).map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="w-8 h-8 rounded-full bg-maroon-100 dark:bg-maroon-900 flex items-center justify-center text-qatar-maroon">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.role ? t(member.role.toLowerCase()) : t('user')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingDepartment(null)}>
                {t("close")}
              </Button>
              {canManageDepartments && (
                <Button 
                  onClick={() => {
                    setViewingDepartment(null);
                    handleEdit(viewingDepartment);
                  }} 
                  className="text-white font-medium"
                  style={{ backgroundColor: '#8a1538' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("edit")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Departments List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingDepartments ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-200 dark:bg-gray-800"></CardHeader>
              <CardContent className="py-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : isDepartmentsError ? (
          <div className="col-span-3 flex justify-center py-10">
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">{t("errorLoadingDepartments")}</p>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/departments"] })}
                >
                  {t("tryAgain")}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-3 flex justify-center py-10">
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Building className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{t("noDepartmentsFound")}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">{t("tryAdjustingFilters")}</p>
                {canManageDepartments && (
                  <Button
                    className="text-white font-medium"
                    style={{ backgroundColor: '#8a1538' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addDepartment")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredDepartments.map((department) => (
            <Card key={department.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-qatar-maroon/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline" className="text-xs font-normal">
                        {department.code}
                      </Badge>
                    </CardDescription>
                  </div>
                  {canManageDepartments && (
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(department)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(department)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("description")}</h3>
                    <p className="text-sm line-clamp-2">{department.description || t("noDepartmentDescription")}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("head")}</h3>
                      <p className="text-sm">{getDepartmentHeadName(department.headUserId || null)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("members")}</h3>
                      <p className="text-sm">{getDepartmentMembers(department.id).length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-3 bg-gray-50 dark:bg-gray-800">
                <Button 
                  variant="ghost" 
                  className="w-full text-center justify-center hover:bg-white dark:hover:bg-gray-800"
                  onClick={() => handleViewDetails(department)}
                >
                  {t("viewDetails")}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}