import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@farmtopalm.local");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const redirectTo = (location.state as any)?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast({
        title: "Login error",
        description: err?.message ?? "Unexpected error during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Supa School Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to manage attendance, meals, and students.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Default admin: <span className="font-mono">admin@farmtopalm.local / Admin123!</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

