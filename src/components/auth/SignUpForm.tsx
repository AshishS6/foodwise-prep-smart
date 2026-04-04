import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SignUpFormProps {
  inviteToken?: string;
  inviteEmail?: string;
}

export const SignUpForm = ({ inviteToken, inviteEmail }: SignUpFormProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  
  const { signUp } = useAuth();

  // Pre-fill email if coming from invite
  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // If there's an invite token, verify it first
      let invitation = null;
      if (inviteToken) {
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', inviteToken)
          .eq('email', email)
          .is('accepted_at', null)
          .single();

        if (inviteError || !inviteData) {
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid or has expired. Please contact your administrator.",
            variant: "destructive",
          });
          return;
        }

        // Check if invitation has expired
        if (new Date(inviteData.expires_at) < new Date()) {
          toast({
            title: "Invitation Expired",
            description: "This invitation has expired. Please contact your administrator for a new invitation.",
            variant: "destructive",
          });
          return;
        }

        setInvitation(inviteData);
      }

      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // If there's an invite token, accept the invitation after signup
        if (inviteToken && invitation) {
          // Wait a bit for the user to be created, then accept invitation
          setTimeout(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Create team member with role from invitation
              const { error: createError } = await supabase
                .from('team_members')
                .insert({
                  user_id: user.id,
                  email: email,
                  name: name,
                  role: invitation.role
                });

              // Mark invitation as accepted
              if (!createError) {
                await supabase
                  .from('invitations')
                  .update({ accepted_at: new Date().toISOString() })
                  .eq('token', inviteToken);
              } else {
                console.error('Error creating team member:', createError);
                toast({
                  title: "Warning",
                  description: "Account created but there was an issue linking your team membership. Please contact support.",
                  variant: "destructive",
                });
              }
            }
          }, 1000);
        }

        toast({
          title: inviteToken ? "Account Created!" : "Check your email!",
          description: inviteToken 
            ? "Your account has been created. Redirecting..."
            : "We've sent you a confirmation link to complete your registration.",
        });
        
        // If invite-based signup, redirect after a moment
        if (inviteToken) {
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          // Clear form for regular signup
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Sign Up Failed",
        description: (error as Error)?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {inviteToken && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            You've been invited to join the team. Please complete your account setup below.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          placeholder="Your full name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          placeholder="your@email.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || !!inviteEmail}
          required
        />
        {inviteEmail && (
          <p className="text-xs text-muted-foreground">Email is pre-filled from your invitation</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          minLength={6}
        />
      </div>
      <Button
        className="w-full"
        onClick={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Sign Up"}
      </Button>
    </div>
  );
};