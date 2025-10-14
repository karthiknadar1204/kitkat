"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, BarChart3, Bug, Zap, Shield, Code2, ArrowRight, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/lib/authStore";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const ctaLink = isAuthenticated ? "/dashboard" : "/sign-up";

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Now Supporting OpenAI • More Coming Soon
            </Badge>
            
            <h1 className="heading-xl max-w-4xl mx-auto">
              Professional{" "}
              <span className="gradient-text">Observability</span>
              {" "}for Your LLM Applications
            </h1>
            
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Kyra is a powerful Node.js SDK that brings LangSmith-style observability to your AI applications. 
              Monitor, trace, and debug your OpenAI integrations with ease.
            </p>
            
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href={ctaLink}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:bg-secondary">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mt-16 glass-effect rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="body-sm text-muted-foreground ml-4">example.js</span>
            </div>
            <pre className="text-sm text-foreground overflow-x-auto">
              <code>{`const Kyra = require('kyra-observability-sdk');

const kyra = new Kyra();

// All calls are automatically traced!
const response = await kyra.chatCompletions({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }]
});

console.log(response.choices[0].message.content);`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4">Everything You Need to Monitor AI</h2>
            <p className="body-lg text-muted-foreground">
              Powerful features designed for modern AI development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="w-6 h-6" />}
              title="Real-time Monitoring"
              description="Track every API call, token usage, and latency in real-time with beautiful dashboards."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Advanced Analytics"
              description="Gain insights into usage patterns, costs, and performance metrics across your applications."
            />
            <FeatureCard
              icon={<Bug className="w-6 h-6" />}
              title="Error Tracking"
              description="Automatically capture and debug errors with detailed stack traces and context."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Lightning Fast"
              description="Minimal overhead with async processing. Your app stays fast while we handle the tracing."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Enterprise Security"
              description="Your data is encrypted at rest and in transit. SOC 2 Type II compliant infrastructure."
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="Developer First"
              description="Simple API, comprehensive docs, and TypeScript support out of the box."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="glass-effect border-border">
            <CardHeader className="text-center pb-8">
              <CardTitle className="heading-lg mb-4">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="body-lg">
                Join developers who trust Kyra for their AI observability needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ctaLink}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary w-full sm:w-auto">
                Schedule Demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="heading-sm">Kyra</span>
            </div>
            <p className="body-sm text-muted-foreground">
              © 2024 Kyra. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="body-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="#" className="body-sm text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="#" className="body-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="glass-effect border-border hover:border-primary/50 transition-all duration-300 group">
      <CardHeader>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-primary">
          {icon}
        </div>
        <CardTitle className="heading-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="body-md">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}