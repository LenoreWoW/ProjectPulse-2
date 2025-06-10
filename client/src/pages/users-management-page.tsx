import React from "react";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Department } from "@/lib/schema-types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  FormRoot, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
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
import { Switch } from "@/components/ui/switch";
import { 
  User as UserIcon, 
  Users, 
  Search, 
  Pencil, 
  Plus, 
  Trash, 
  Mail, 
  Phone, 
  Shield, 
  Building
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGate } from "@/hooks/use-permissions";

// Form schema for adding or editing users
const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  role: z.enum(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector", "Executive"], {
    required_error: "Role is required",
  }),
  departmentId: z.number().nullable(),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required",
  }),
  preferredLanguage: z.enum(["en", "ar"], {
    required_error: "Preferred language is required",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersManagementPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Check if current user has permission to manage users
  const canManageUsers = ["Administrator", "MainPMO"].includes(user?.role || "");
  
  // Fetch users
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
    isError: isUsersError,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch departments
  const { 
    data: departments = [], 
    isLoading: isLoadingDepartments,
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Define form with react-hook-form and zod validation
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      role: "SubPMO",
      departmentId: null,
      status: "Active",
      preferredLanguage: "en",
    },
  });
  
  // Reset form when adding a new user
  const resetForm = () => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      role: "SubPMO",
      departmentId: null,
      status: "Active",
      preferredLanguage: "en",
    });
  };
  
  // Set form values when editing a user
  useEffect(() => {
    if (editingUser) {
      form.reset({
        name: editingUser.name,
        email: editingUser.email || "",
        phone: editingUser.phone || "",
        username: editingUser.username,
        // Don't set password when editing
        password: "",
        role: editingUser.role as any,
        departmentId: editingUser.departmentId,
        status: editingUser.status as any,
        preferredLanguage: editingUser.preferredLanguage as any,
      });
    }
  }, [editingUser, form]);
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await apiRequest("POST", "/api/users", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: t("userCreated"),
        description: t("userCreatedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("userCreationFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: UserFormValues }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      toast({
        title: t("userUpdated"),
        description: t("userUpdatedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("userUpdateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t("userDeleted"),
        description: t("userDeletedSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("userDeletionFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: UserFormValues) => {
    // If no password is provided when editing, remove it from submission
    if (editingUser && !values.password) {
      const { password, ...rest } = values;
      updateUserMutation.mutate({ id: editingUser.id, values: rest });
    } else if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, values });
    } else {
      createUserMutation.mutate(values);
    }
  };
  
  // Handle edit button click
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (user: User) => {
    if (window.confirm(t("confirmUserDeletion"))) {
      deleteUserMutation.mutate(user.id);
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role ? user.role.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  // Get department name by id
  const getDepartmentName = (departmentId: number | null | undefined) => {
    if (!departmentId) return t("notAssigned");
    const department = departments.find((dept) => dept.id === departmentId);
    return department ? department.name : t("notAssigned");
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-contrast dark:text-white">{t("userManagement")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t("manageSystemUsers")}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("searchUsers")}
              className="pl-10 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {canManageUsers && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-qatar-maroon hover:bg-maroon-800">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addUser")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("addNewUser")}</DialogTitle>
                  <DialogDescription>
                    {t("addUserDescription")}
                  </DialogDescription>
                </DialogHeader>
                <FormRoot form={form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("enterFullName")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("email")}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder={t("enterEmail")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("phone")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("enterPhone")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("username")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("enterUsername")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{editingUser ? t("newPassword") : t("password")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder={editingUser ? t("leaveEmptyToKeep") : t("enterPassword")} 
                                {...field} 
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
                        name="role"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("role")}</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectRole")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Administrator">{t("administrator")}</SelectItem>
                                  <SelectItem value="MainPMO">{t("mainPMO")}</SelectItem>
                                  <SelectItem value="SubPMO">{t("subPMO")}</SelectItem>
                                  <SelectItem value="DepartmentDirector">{t("departmentDirector")}</SelectItem>
                                  <SelectItem value="Executive">{t("executive")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("department")}</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={(value: string) => field.onChange(value === "none" ? null : parseInt(value))} 
                                defaultValue={field.value?.toString() || "none"}
                                value={field.value?.toString() || "none"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectDepartment")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">{t("notAssigned")}</SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("status")}</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectStatus")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Active">{t("active")}</SelectItem>
                                  <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="preferredLanguage"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>{t("preferredLanguage")}</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("selectLanguage")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="ar">العربية</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          if (isEditDialogOpen) {
                            setIsEditDialogOpen(false);
                            setEditingUser(null);
                          } else {
                            setIsAddDialogOpen(false);
                          }
                          resetForm();
                        }}
                      >
                        {t("cancel")}
                      </Button>
                      <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800">
                        {editingUser ? t("updateUser") : t("addUser")}
                      </Button>
                    </DialogFooter>
                  </form>
                </FormRoot>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("editUser")}</DialogTitle>
                <DialogDescription>
                  {t("editUserDescription")}
                </DialogDescription>
              </DialogHeader>
              <FormRoot form={form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("enterFullName")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t("enterEmail")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("enterPhone")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("enterUsername")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("newPassword")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t("leaveEmptyToKeep")}
                              {...field}
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
                      name="role"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("role")}</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectRole")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Administrator">{t("administrator")}</SelectItem>
                                <SelectItem value="MainPMO">{t("mainPMO")}</SelectItem>
                                <SelectItem value="SubPMO">{t("subPMO")}</SelectItem>
                                <SelectItem value="DepartmentDirector">{t("departmentDirector")}</SelectItem>
                                <SelectItem value="Executive">{t("executive")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("department")}</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={(value: string) => field.onChange(value === "none" ? null : parseInt(value))} 
                              defaultValue={field.value?.toString() || "none"}
                              value={field.value?.toString() || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectDepartment")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">{t("notAssigned")}</SelectItem>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("status")}</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectStatus")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Active">{t("active")}</SelectItem>
                                <SelectItem value="Inactive">{t("inactive")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>{t("preferredLanguage")}</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectLanguage")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingUser(null);
                        resetForm();
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" className="bg-qatar-maroon hover:bg-maroon-800">
                      {t("updateUser")}
                    </Button>
                  </DialogFooter>
                </form>
              </FormRoot>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">{t("allUsers")}</TabsTrigger>
          <TabsTrigger value="administrators">{t("administrators")}</TabsTrigger>
          <TabsTrigger value="directors">{t("directors")}</TabsTrigger>
          <TabsTrigger value="pmo">{t("pmoTeam")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {renderUsersList(filteredUsers)}
        </TabsContent>
        
        <TabsContent value="administrators" className="mt-6">
          {renderUsersList(filteredUsers.filter(u => u.role === "Administrator" || u.role === "MainPMO"))}
        </TabsContent>
        
        <TabsContent value="directors" className="mt-6">
          {renderUsersList(filteredUsers.filter(u => u.role === "DepartmentDirector" || u.role === "Executive"))}
        </TabsContent>
        
        <TabsContent value="pmo" className="mt-6">
          {renderUsersList(filteredUsers.filter(u => u.role === "SubPMO"))}
        </TabsContent>
      </Tabs>
      
      {/* Department Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("totalUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <Users className="h-5 w-5 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">{users.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("activeUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <UserIcon className="h-5 w-5 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">
                {users.filter(u => u.status === "Active").length}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("administrators")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <Shield className="h-5 w-5 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">
                {users.filter(u => u.role === "Administrator" || u.role === "MainPMO").length}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("departmentDirectors")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-full">
                <Building className="h-5 w-5 text-qatar-maroon" />
              </div>
              <div className="text-3xl font-bold">
                {users.filter(u => u.role === "DepartmentDirector").length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  function renderUsersList(usersList: User[]) {
    if (isLoadingUsers || isLoadingDepartments) {
      return (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-qatar-maroon"></div>
        </div>
      );
    }
    
    if (isUsersError) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 dark:text-gray-400">{t("errorLoadingUsers")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}
            >
              {t("tryAgain")}
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    if (usersList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100">{t("noUsersFound")}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t("tryAdjustingFilters")}</p>
            {canManageUsers && (
              <Button
                className="mt-4 bg-qatar-maroon hover:bg-maroon-800"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addUser")}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("contactInfo")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("department")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              {canManageUsers && <TableHead className="text-right">{t("actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-maroon-100 dark:bg-maroon-900 text-qatar-maroon flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-2 text-gray-500" />
                      <span>{user.email || "-"}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.role ? t(user.role.toLowerCase()) : '-'}</TableCell>
                <TableCell>{getDepartmentName(user.departmentId)}</TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${user.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}
                  >
                    {user.status ? t(user.status.toLowerCase()) : '-'}
                  </span>
                </TableCell>
                {canManageUsers && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        {t("edit")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        {t("delete")}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}