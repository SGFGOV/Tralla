import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/auth-context";
import { DeviceProvider } from "./contexts/device-context";
import NotFound from "@/pages/not-found";
import Login from "./pages/login";
import Register from "./pages/register";
import Nearby from "./pages/nearby";
import Chats from "./pages/chats";
import ChatDetail from "./pages/chat-detail";
import Groups from "./pages/groups";
import GroupDetail from "./pages/group-detail";
import Profile from "./pages/profile";
import ProfileDetail from "./pages/profile-detail";
import AppLayout from "./components/layout/app-layout";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const auth = localStorage.getItem("user");

  if (!auth) {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <PrivateRoute>
          <AppLayout>
            <Nearby />
          </AppLayout>
        </PrivateRoute>
      </Route>
      
      <Route path="/nearby">
        <PrivateRoute>
          <AppLayout>
            <Nearby />
          </AppLayout>
        </PrivateRoute>
      </Route>
      
      <Route path="/chats">
        <PrivateRoute>
          <AppLayout>
            <Chats />
          </AppLayout>
        </PrivateRoute>
      </Route>
      
      <Route path="/chats/:id">
        {(params) => (
          <PrivateRoute>
            <ChatDetail id={Number(params.id)} />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/groups">
        <PrivateRoute>
          <AppLayout>
            <Groups />
          </AppLayout>
        </PrivateRoute>
      </Route>
      
      <Route path="/groups/:id">
        {(params) => (
          <PrivateRoute>
            <GroupDetail id={Number(params.id)} />
          </PrivateRoute>
        )}
      </Route>
      
      <Route path="/profile">
        <PrivateRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </PrivateRoute>
      </Route>
      
      <Route path="/profile/:id">
        {(params) => (
          <PrivateRoute>
            <ProfileDetail id={Number(params.id)} />
          </PrivateRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceProvider>
          <Router />
          <Toaster />
        </DeviceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
