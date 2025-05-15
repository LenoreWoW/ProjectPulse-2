import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";
import { useI18n } from "@/hooks/use-i18n-new";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Users, ShieldCheck } from "lucide-react";

type UserPermissions = {
  userId: number;
  role: string;
  customPermissions?: {
    [key: string]: boolean;
  };
};

type PermissionEditDialogProps = {
  user: User;
  onSave: (userId: number, newRole: string, customPermissions?: { [key: string]: boolean }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PermissionEditDialog({ user, onSave, open, onOpenChange }: PermissionEditDialogProps) {
  const { t } = useI18n();
  const [role, setRole] = useState<string>(user.role || "User");
  const [customEnabled, setCustomEnabled] = useState<boolean>(false);
  const [customPermissions, setCustomPermissions] = useState<{ [key: string]: boolean }>({});
  const permissions = usePermissions();
  
  // Reset state when user changes
  useEffect(() => {
    setRole(user.role || "User");
    setCustomEnabled(false);
    setCustomPermissions({});
  }, [user]);
  
  const permissionsList = Object.keys(permissions).map(key => ({
    id: key,
    name: t(key),
  }));
  
  const handleSave = () => {
    onSave(
      user.id, 
      role, 
      customEnabled ? customPermissions : undefined
    );
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editUserPermissions")}</DialogTitle>
          <DialogDescription>
            {t("editingPermissionsFor")} {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <Label htmlFor="role">{t("role")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">{t("User")}</SelectItem>
                <SelectItem value="ProjectManager">{t("ProjectManager")}</SelectItem>
                <SelectItem value="SubPMO">{t("SubPMO")}</SelectItem>
                <SelectItem value="MainPMO">{t("MainPMO")}</SelectItem>
                <SelectItem value="DepartmentDirector">{t("DepartmentDirector")}</SelectItem>
                <SelectItem value="Executive">{t("Executive")}</SelectItem>
                <SelectItem value="Administrator">{t("Administrator")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="customPermissions" 
              checked={customEnabled}
              onCheckedChange={(checked) => setCustomEnabled(checked as boolean)}
            />
            <Label htmlFor="customPermissions">{t("useCustomPermissions")}</Label>
          </div>
          
          {customEnabled && (
            <div className="space-y-2 mt-4 border rounded-md p-4">
              <h4 className="font-medium mb-2">{t("customPermissions")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {permissionsList.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={permission.id}
                      checked={customPermissions[permission.id] || false}
                      onCheckedChange={(checked) => {
                        setCustomPermissions({
                          ...customPermissions,
                          [permission.id]: checked as boolean
                        });
                      }}
                    />
                    <Label htmlFor={permission.id}>{permission.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UserPermissionsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const permissions = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch all users
  const { 
    data: users = [], 
    isLoading,
    error
  } = useQuery<User[]>({ 
    queryKey: ['/api/users'], 
    enabled: permissions.canManageUsers,
  });
  
  // Update user role and custom permissions
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role, customPermissions }: UserPermissions) => {
      const res = await fetch(`/api/users/${userId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, customPermissions }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user permissions');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("permissionsUpdated"),
        description: t("userPermissionsUpdatedSuccessfully"),
      });
      // Invalidate users query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role ? user.role.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      )
    : users;
    
  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };
  
  const handleSavePermissions = (userId: number, role: string, customPermissions?: { [key: string]: boolean }) => {
    updateUserMutation.mutate({ userId, role, customPermissions });
  };
  
  if (!permissions.canManageUsers) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t("accessDenied")}</CardTitle>
            <CardDescription>
              {t("noPermissionToManageUsers")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <ShieldCheck className="mr-2 h-6 w-6 text-maroon-600 dark:text-maroon-300" />
              {t("userPermissionsManagement")}
            </CardTitle>
            <CardDescription>
              {t("manageUserRolesAndPermissions")}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="max-w-md">
              <div className="relative">
                <Input
                  placeholder={t("searchUsers")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400 dark:text-gray-500">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-maroon-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-800 dark:text-red-300">
              {t("errorLoadingUsers")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs">
                          {user.role ? t(user.role) : t("User")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPermissions(user)}
                          disabled={user.id === currentUser?.id} // Prevent editing own permissions
                          className={
                            user.id === currentUser?.id 
                              ? "cursor-not-allowed opacity-50" 
                              : ""
                          }
                        >
                          {t("editPermissions")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        {searchTerm 
                          ? t("noUsersMatchSearch") 
                          : t("noUsersFound")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedUser && (
        <PermissionEditDialog
          user={selectedUser}
          onSave={handleSavePermissions}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}