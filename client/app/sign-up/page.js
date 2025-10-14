"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Github, Mail, Check } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function SignUpPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await register(name, formData.email, formData.password);
      router.push("/sign-in");
    } catch (err) {
      // Error is handled by the store
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-background to-background"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="heading-md">Kyra</span>
              </Link>
              
              <h1 className="heading-lg mb-4">
                Start monitoring your AI applications today
              </h1>
              <p className="body-lg text-muted-foreground">
                Join thousands of developers using Kyra for production-grade observability.
              </p>
            </div>

            <div className="space-y-4">
              <BenefitItem text="Real-time monitoring and analytics" />
              <BenefitItem text="Advanced error tracking and debugging" />
              <BenefitItem text="Production-grade observability" />
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div>
            <Card className="glass-effect border-border">
              <CardHeader className="text-center">
                <CardTitle className="heading-lg">Create Account</CardTitle>
                <CardDescription className="body-md">
                  Get started with your free account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Sign Up Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <p className="body-sm text-red-500">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="body-md">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="bg-background/50 border-input focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="body-md">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="bg-background/50 border-input focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="body-md">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-background/50 border-input focus:border-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="body-md">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-background/50 border-input focus:border-primary"
                      minLength={8}
                      required
                    />
                    <p className="body-sm text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="body-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="body-sm text-muted-foreground text-center mt-6">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-foreground hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-foreground hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <p className="body-md text-foreground">{text}</p>
    </div>
  );
}