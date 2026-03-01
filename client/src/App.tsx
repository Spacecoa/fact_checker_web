import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardBlog from "./pages/DashboardBlog";
import ReportDetailBlog from "./pages/ReportDetailBlog";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/(index)?"} component={Home} />
      <Route path={"/dashboard"} component={() => <DashboardLayout><DashboardBlog /></DashboardLayout>} />
      <Route path={"/reports/:id"} component={(props: any) => <DashboardLayout><ReportDetailBlog id={props.params.id} /></DashboardLayout>} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
