"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/lib/authStore";
import { sessionsApi } from "@/lib/api/sessions";

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Wait for hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/sign-in");
    return null;
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create session and redirect to project detail page
      const sessionData = await sessionsApi.createSession(projectName);
      router.push(`/dashboard/${encodeURIComponent(projectName)}/${sessionData.sessionId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24 max-w-4xl">
        {/* Create Project Card */}
        <Card className="glass-effect border-border">
            <CardHeader>
              <CardTitle className="heading-lg">Create New Project</CardTitle>
              <CardDescription className="body-md">
                Give your AI application a name to start tracking traces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="body-sm text-red-500">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="projectName" className="body-md">Project Name</Label>
                <Input
                  id="projectName"
                  type="text"
                  placeholder="my-awesome-ai-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-background/50 border-input focus:border-primary"
                  disabled={loading}
                />
                <p className="body-sm text-muted-foreground">
                  Choose a descriptive name for your project
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleCreateProject}
                  disabled={loading || !projectName.trim()}
                >
                  {loading ? "Creating..." : "Create Project"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

