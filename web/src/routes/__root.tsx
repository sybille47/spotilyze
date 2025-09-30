import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && router.state.location.pathname !== "/auth/login") {
      router.navigate({ to: "/auth/login", replace: true });
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animated-bg"></div>
        <div className="text-muted-foreground relative z-10">Loading...</div>
      </div>
    );
  }

  // If not authenticated and not on login page, show nothing (redirect will happen)
  if (!user && router.state.location.pathname !== "/auth/login") {
    return (
      <div>
        <div className="animated-bg"></div>
      </div>
    );
  }

  // If not authenticated but on login page, show the login page
  if (!user) {
    return (
      <div>
        <div className="animated-bg"></div>
        <Outlet />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/auth/login", replace: true });
  };

  return (
    <div className="min-h-screen">
      <div className="animated-bg"></div>
      
      <nav className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 relative">
          {/* Left - Navigation Links */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex space-x-6">
            <Link
              to="/upload"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              activeProps={{
                className: "text-primary"
              }}
            >
              Upload
            </Link>
            <Link
              to="/stats"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              activeProps={{
                className: "text-primary"
              }}
            >
              Statistics
            </Link>
            <Link
              to="/settings"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium"
              activeProps={{
                className: "text-primary"
              }}
            >
              Settings
            </Link>
          </div>

          {/* Center - Logo (absolutely centered) */}
          <div className="flex justify-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Spotilyze
            </h1>
          </div>

          {/* Right - User Profile */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4">
            <div className="glass-subtle px-3 py-1.5 rounded-full">
              <span className="text-foreground text-sm font-medium">
                {user.username}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="glass-subtle border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main key={user?.id || "logged-out"} className="relative">
        <Outlet />
      </main>
    </div>
  );
}