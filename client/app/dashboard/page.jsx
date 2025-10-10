"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Folder, Calendar, Key } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/lib/authStore";
import { sessionsApi } from "@/lib/api/sessions";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait for store to hydrate before checking auth
    if (!_hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, _hasHydrated]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await sessionsApi.getSessions();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-lg mb-2">Projects</h1>
          <p className="body-md text-muted-foreground">
            Manage your AI observability projects
          </p>
        </div>

        {/* Create New Project Button */}
        <div className="mb-8">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => router.push("/dashboard/new")}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Project
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="body-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-effect border-border animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <Card className="glass-effect border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Folder className="w-8 h-8 text-primary" />
              </div>
              <h3 className="heading-sm mb-2">No projects yet</h3>
              <p className="body-md text-muted-foreground mb-6 text-center max-w-md">
                Create your first project to start tracking your AI application traces
              </p>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push("/dashboard/new")}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Projects Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${encodeURIComponent(project.appName)}/${project.id}`}
              >
                <Card className="glass-effect border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Folder className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="heading-sm group-hover:text-primary transition-colors">
                      {project.appName || "Untitled Project"}
                    </CardTitle>
                    <CardDescription className="body-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(project.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Key className="w-4 h-4" />
                      <span className="body-sm">API Keys configured</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
