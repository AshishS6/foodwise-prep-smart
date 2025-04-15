
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
import { useAuthStore } from "@/stores/authStore";
import { Loader2, UserPlus } from "lucide-react";
import { TeamMember } from "@/types";

export function TeamManagement() {
  const { toast } = useToast();
  const { userRole, inviteTeamMember } = useAuthStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Cashier");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
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
      await inviteTeamMember(email, role);
      
      toast({
        title: "Invitation sent",
        description: `${email} has been invited as ${role}`,
      });
      
      setEmail("");
      fetchTeamMembers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Invitation failed",
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

  // Only allow admins to access this component
  if (userRole !== "Admin") {
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.name || "Not set"}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        roleDisplayClasses[member.role as keyof typeof roleDisplayClasses] || 
                        "bg-gray-100 text-gray-800 border-gray-300"
                      }`}>
                        {member.role}
                      </span>
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
