
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";
import { getDefaultRoute } from "@/utils/getDefaultRoute";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: teamMember, isLoading: teamMemberLoading } = useCurrentTeamMember();
  const [searchParams] = useSearchParams();
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const inviteToken = searchParams.get("token");
  const inviteEmail = searchParams.get("email");

  // Check for invite token and switch to signup tab
  useEffect(() => {
    if (inviteToken) {
      setDefaultTab("signup");
    }
  }, [inviteToken]);

  // If already authenticated, redirect to role-based default route (use useEffect to avoid render issues)
  useEffect(() => {
    if (user && !loading && !teamMemberLoading) {
      // Wait for team member data to be available before redirecting
      // This prevents redirect loops and blank pages
      const timer = setTimeout(() => {
        const defaultRoute = getDefaultRoute(teamMember);
        navigate(defaultRoute, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, teamMember, teamMemberLoading, navigate]);

  // If already authenticated, show loading while redirecting or waiting for team member data
  if (user && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {teamMemberLoading ? "Loading..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Payasakkada</CardTitle>
          <CardDescription className="text-center">
            {inviteToken 
              ? "Complete your account setup to join the team"
              : "Sign in or create an account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} value={defaultTab} onValueChange={(v) => setDefaultTab(v as "signin" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm inviteToken={inviteToken || undefined} inviteEmail={inviteEmail || undefined} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
