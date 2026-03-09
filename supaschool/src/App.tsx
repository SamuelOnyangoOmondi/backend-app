
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Schools from "./pages/Schools";
import NotFound from "./pages/NotFound";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Hodari from "./pages/Hodari";
import Attendance from "./pages/Attendance";
import Meals from "./pages/Meals";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Classes from "./pages/Classes";
import Curriculum from "./pages/Curriculum";
import Exams from "./pages/Exams";
import Timetable from "./pages/Timetable";
import Facilities from "./pages/Facilities";
import Finance from "./pages/Finance";
import Transport from "./pages/Transport";
import Messages from "./pages/Messages";
import FlamiAssistantPage from "./pages/flami/FlamiAssistant";
import FlamiKnowledgePage from "./pages/flami/FlamiKnowledge";
import FlamiCurriculumPage from "./pages/flami/FlamiCurriculum";
import FlamiModelsPage from "./pages/flami/FlamiModels";
import FlamiSearchPage from "./pages/flami/FlamiSearch";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";

// Create empty placeholder pages for the routes in the sidebar
const Support = () => <h1 className="text-2xl font-bold p-6">Support Page</h1>;

// App pages
const Somanasi = () => <h1 className="text-2xl font-bold p-6">Somanasi App</h1>;
const Zazi = () => <h1 className="text-2xl font-bold p-6">Zazi (Parents) App</h1>;

const queryClient = new QueryClient();

console.log("App component is rendering");

const App = () => {
  console.log("Inside App component");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />
              <Route
                path="/schools"
                element={
                  <RequireAuth>
                    <Schools />
                  </RequireAuth>
                }
              />
              <Route
                path="/teachers"
                element={
                  <RequireAuth>
                    <Teachers />
                  </RequireAuth>
                }
              />
              <Route
                path="/students"
                element={
                  <RequireAuth>
                    <Students />
                  </RequireAuth>
                }
              />
              <Route
                path="/attendance"
                element={
                  <RequireAuth>
                    <Attendance />
                  </RequireAuth>
                }
              />
              <Route
                path="/classes"
                element={
                  <RequireAuth>
                    <Classes />
                  </RequireAuth>
                }
              />
              <Route
                path="/curriculum"
                element={
                  <RequireAuth>
                    <Curriculum />
                  </RequireAuth>
                }
              />
              <Route
                path="/exams"
                element={
                  <RequireAuth>
                    <Exams />
                  </RequireAuth>
                }
              />
              <Route
                path="/timetable"
                element={
                  <RequireAuth>
                    <Timetable />
                  </RequireAuth>
                }
              />
              <Route
                path="/facilities"
                element={
                  <RequireAuth>
                    <Facilities />
                  </RequireAuth>
                }
              />
              <Route
                path="/finance"
                element={
                  <RequireAuth>
                    <Finance />
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <Reports />
                  </RequireAuth>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireAuth>
                    <Analytics />
                  </RequireAuth>
                }
              />
              <Route
                path="/transport"
                element={
                  <RequireAuth>
                    <Transport />
                  </RequireAuth>
                }
              />
              <Route
                path="/meals"
                element={
                  <RequireAuth>
                    <Meals />
                  </RequireAuth>
                }
              />
              <Route
                path="/messages"
                element={
                  <RequireAuth>
                    <Messages />
                  </RequireAuth>
                }
              />

              {/* Flami AI routes */}
              <Route
                path="/flami"
                element={
                  <RequireAuth>
                    <FlamiAssistantPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/flami/knowledge"
                element={
                  <RequireAuth>
                    <FlamiKnowledgePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/flami/curriculum"
                element={
                  <RequireAuth>
                    <FlamiCurriculumPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/flami/models"
                element={
                  <RequireAuth>
                    <FlamiModelsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/flami/search"
                element={
                  <RequireAuth>
                    <FlamiSearchPage />
                  </RequireAuth>
                }
              />

              {/* App routes */}
              <Route
                path="/hodari"
                element={
                  <RequireAuth>
                    <Hodari />
                  </RequireAuth>
                }
              />
              <Route
                path="/somanasi"
                element={
                  <RequireAuth>
                    <Somanasi />
                  </RequireAuth>
                }
              />
              <Route
                path="/zazi"
                element={
                  <RequireAuth>
                    <Zazi />
                  </RequireAuth>
                }
              />

              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />
              <Route
                path="/support"
                element={
                  <RequireAuth>
                    <Support />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

console.log("App export reached");
export default App;
