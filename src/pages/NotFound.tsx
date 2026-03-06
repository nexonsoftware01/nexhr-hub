import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-dot-pattern">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
        </div>
        <div>
          <h1 className="text-7xl font-extrabold text-foreground tracking-tighter">404</h1>
          <p className="mt-3 text-lg text-muted-foreground">This page doesn't exist or has been moved.</p>
        </div>
        <Link to="/">
          <Button variant="default" className="gap-2 rounded-xl h-11">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
