import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl text-gray-600">Page not found</p>
        <p className="mb-6 text-sm text-gray-400">
          No match for <code className="bg-gray-200 px-1 rounded">{location.pathname}</code>
        </p>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
