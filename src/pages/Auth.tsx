
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useCurrentTeamMember } from "@/hooks/useTeamMembers";
import { getDefaultRoute } from "@/utils/getDefaultRoute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ShieldCheck, ChefHat, CreditCard, BarChart3 } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@foodwise.demo",
    password: "FoodWise@2024",
    name: "Aryan Kapoor",
    description: "Full access — menu, inventory, analytics, team",
    icon: ShieldCheck,
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100 border-violet-200",
  },
  {
    role: "Manager",
    email: "manager@foodwise.demo",
    password: "FoodWise@2024",
    name: "Priya Nair",
    description: "Operations — orders, reports, prep planning",
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    role: "Kitchen Staff",
    email: "kitchen@foodwise.demo",
    password: "FoodWise@2024",
    name: "Ravi Kumar",
    description: "Kitchen view — prep plans, live orders",
    icon: ChefHat,
    color: "text-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-200",
  },
  {
    role: "Cashier",
    email: "cashier@foodwise.demo",
    password: "FoodWise@2024",
    name: "Deepa Sharma",
    description: "POS only — take orders, view history",
    icon: CreditCard,
    color: "text-green-600",
    bg: "bg-green-50 hover:bg-green-100 border-green-200",
  },
];

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const { data: teamMember, isLoading: teamMemberLoading } = useCurrentTeamMember();
  const [searchParams] = useSearchParams();
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const inviteToken = searchParams.get("token");
  const inviteEmail = searchParams.get("email");

  useEffect(() => {
    if (inviteToken) setDefaultTab("signup");
  }, [inviteToken]);

  useEffect(() => {
    if (user && !loading && !teamMemberLoading) {
      const timer = setTimeout(() => {
        const defaultRoute = getDefaultRoute(teamMember);
        navigate(defaultRoute, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, teamMember, teamMemberLoading, navigate]);

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.role);
    try {
      const { error } = await signIn(account.email, account.password);
      if (error) {
        toast({
          title: "Demo login unavailable",
          description: "Demo accounts haven't been set up yet. See supabase/demo-users.sql.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Logged in as ${account.name}`,
          description: `Exploring as ${account.role}`,
        });
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: teamMemberData } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', currentUser.id as any)
            .maybeSingle();
          navigate(getDefaultRoute((teamMemberData as any) || null));
        } else {
          navigate("/");
        }
      }
    } catch {
      toast({
        title: "Demo login failed",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(null);
    }
  };

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Main sign-in card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Payasakkada</CardTitle>
            <CardDescription className="text-center">
              {inviteToken
                ? "Complete your account setup to join the team"
                : "Sign in or create an account to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={defaultTab}
              value={defaultTab}
              onValueChange={(v) => setDefaultTab(v as "signin" | "signup")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm
                  inviteToken={inviteToken || undefined}
                  inviteEmail={inviteEmail || undefined}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>

        {/* Demo accounts */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">
              Try a demo account
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.role;
              return (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={!!demoLoading}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${account.bg}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <Icon className={`h-4 w-4 ${account.color}`} />
                    {isLoading && (
                      <div className={`h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent ${account.color}`} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">{account.role}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-snug">
                      {account.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
