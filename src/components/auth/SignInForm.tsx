
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRoute } from "@/utils/getDefaultRoute";
import { supabase } from "@/integrations/supabase/client";

export const SignInForm = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        // Fetch team member to determine default route
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          try {
            const { data: teamMemberData } = await supabase
              .from('team_members')
              .select('*')
              .eq('user_id', currentUser.id as any)
              .maybeSingle();
            
            const defaultRoute = getDefaultRoute((teamMemberData as any) || null);
            navigate(defaultRoute);
          } catch {
            // If error fetching team member, default to dashboard
            navigate("/");
          }
        } else {
          // Fallback to dashboard if user not found
          navigate("/");
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Sign In Failed",
        description: (error instanceof Error ? error.message : "An unexpected error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4 pb-safe-bottom">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="your@email.com"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[44px] text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          inputMode="text"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[44px] text-base"
        />
      </div>
      <Button
        className="w-full min-h-[44px] text-base"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </div>
  );
};
