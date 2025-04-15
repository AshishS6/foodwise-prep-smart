
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

export default function TeamManagementPage() {
  const navigate = useNavigate();
  const { session, userRole, userName } = useAuthStore();
  
  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'Admin') {
      navigate('/');
      return;
    }
  }, [session, userRole, navigate]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            {userName ? `Logged in as ${userName}` : ""} {userRole ? `(${userRole})` : ""}
          </p>
        </div>
      </div>
      
      <TeamManagement />
    </div>
  );
}
