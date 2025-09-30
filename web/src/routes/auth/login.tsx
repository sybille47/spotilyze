import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

// TODO: Validate Data in FrontEnd (ZOD)

export const Route = createFileRoute("/auth/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = isLogin
      ? await login(username, password)
      : await register(username, email, password);

    if (success) {
      navigate({ to: "/stats" });
    } else {
      setError(isLogin ? "Invalid credentials" : "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left Side - App Info */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative z-10">
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit glass-subtle">
              Music Analytics Platform
            </Badge>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Spotilyze
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transform your Spotify streaming history into meaningful insights about your music taste and discover patterns you never knew existed.
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary/60 rounded-sm"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Deep Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze your complete listening history with advanced statistics and trends
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-accent/60 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Music Discovery</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover patterns in your music taste and see how it evolves over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary/60 to-accent/60 rounded-lg"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Visual Charts</h3>
                    <p className="text-sm text-muted-foreground">
                      Beautiful interactive charts showing your listening habits and preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground glass-subtle px-4 py-2 rounded-full w-fit">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Over 105,000+ tracks analyzed and counting</span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <Card className="w-full max-w-md glass">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to view your music analytics"
                : "Join Spotilyze to start analyzing your music"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="glass-subtle"
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-subtle"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-subtle"
                />
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline text-sm transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}