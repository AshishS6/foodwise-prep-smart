
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentTeamMember, useUpdateTeamMember } from "@/hooks/useTeamMembers";
import { Loader2, UserPlus, Edit2 } from "lucide-react";
import { TeamMember } from "@/types";

export function TeamManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: currentTeamMember } = useCurrentTeamMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Cashier");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const updateTeamMember = useUpdateTeamMember();

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      // Set a small timeout to ensure database updates are reflected
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("role", { ascending: false })
        .order("email");

      if (error) throw error;
      
      // Cast data to TeamMember[] and ensure name is handled
      const members = (data || []).map(member => ({
        ...member,
        name: member.name || member.email.split('@')[0]
      })) as TeamMember[];

      console.log("Fetched team members:", members);
      setTeamMembers(members);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error loading team",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user already exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', email)
        .single();

      if (existingMember) {
        throw new Error('User is already a team member');
      }

      // For now, directly create the team member
      // In production, you'd send an invitation email first
      const { data, error } = await supabase
        .from('team_members')
        .insert([
          {
            user_id: crypto.randomUUID(), // Temporary ID, will be updated when user signs up
            email: email,
            role: role,
            name: email.split('@')[0]
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Team member added",
        description: `${email} has been added as ${role}. They can now sign up and access the system.`,
      });
      
      setEmail("");
      fetchTeamMembers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Failed to add team member",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleDisplayClasses = {
    Admin: "bg-red-100 text-red-800 border-red-300",
    Manager: "bg-purple-100 text-purple-800 border-purple-300",
    "Kitchen Staff": "bg-green-100 text-green-800 border-green-300",
    Cashier: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const handleEditRole = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditingRole(member.role);
  };

  const handleSaveRole = async (memberId: string) => {
    if (!editingRole) {
      toast({
        title: "Role required",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateTeamMember.mutate({
        id: memberId,
        role: editingRole,
      });

      if (updateTeamMember.error) {
        throw new Error(updateTeamMember.error.message);
      }

      if (result) {
        toast({
          title: "Role updated",
          description: "Team member role has been updated successfully",
        });

        setEditingMemberId(null);
        setEditingRole("");
        fetchTeamMembers(); // Refresh the list
      } else {
        throw new Error("Failed to update role");
      }
    } catch (error: any) {
      toast({
        title: "Failed to update role",
        description: error.message || "An error occurred while updating the role",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditingRole("");
  };

  // Only allow admins to access this component
  if (currentTeamMember?.role !== "Admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            You don't have permission to manage team members.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>
          Invite new team members and manage existing ones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="team@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={setRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Kitchen Staff">Kitchen Staff</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.email === 'ashishsasikumar@gmail.com' ? 'Ashish' : (member.name || "Not set")}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {editingMemberId === member.id ? (
                        <Select
                          value={editingRole}
                          onValueChange={setEditingRole}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Kitchen Staff">Kitchen Staff</SelectItem>
                            <SelectItem value="Cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          roleDisplayClasses[member.role as keyof typeof roleDisplayClasses] || 
                          "bg-gray-100 text-gray-800 border-gray-300"
                        }`}>
                          {member.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingMemberId === member.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveRole(member.id)}
                            disabled={updateTeamMember.loading}
                          >
                            {updateTeamMember.loading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateTeamMember.loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(member)}
                          className="gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit Role
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
