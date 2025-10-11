"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/lib/authStore";
import { apiKeysApi } from "@/lib/api/apiKeys";
import { dashboardApi } from "@/lib/api/dashboard";
import TokenDistributionChart from "@/components/charts/TokenDistributionChart";
import SuccessErrorChart from "@/components/charts/SuccessErrorChart";
import ToolBreakdownChart from "@/components/charts/ToolBreakdownChart";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
import PrimaryMetrics from "@/components/dashboard/PrimaryMetrics";
import AdvancedMetrics from "@/components/dashboard/AdvancedMetrics";
import ApiKeySidebar from "@/components/dashboard/ApiKeySidebar";
import TracesTable from "@/components/dashboard/TracesTable";
import TraceDetailSidebar from "@/components/dashboard/TraceDetailSidebar";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  
  // State
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState({});
  const [newApiKey, setNewApiKey] = useState(null);
  const [traces, setTraces] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('welcome');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showApiKeySidebar, setShowApiKeySidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [showTraceDetailSidebar, setShowTraceDetailSidebar] = useState(false);
  const [stats, setStats] = useState({ 
    runCount: 0,
    errorRate: 0,
    errorCount: 0,
    successCount: 0,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    inputTokensPerTraceP50: 0,
    inputTokensPerTraceP99: 0,
    outputTokensPerTraceP50: 0,
    outputTokensPerTraceP99: 0,
    totalCost: 0,
    medianCostPerTrace: 0,
    p99CostPerTrace: 0,
    traceAvgLatency: 0,
    traceP50Latency: 0,
    traceP99Latency: 0,
    llmCount: 0,
    llmAvgLatency: 0,
    llmP50Latency: 0,
    llmP99Latency: 0,
    toolBreakdown: [],
    runTypeBreakdown: [],
  });
  const [tracesLoading, setTracesLoading] = useState(true);

  const projectName = decodeURIComponent(params.projectName);
  const sessionId = params.id;

  // Auth check
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    fetchApiKeys();
    fetchTraces();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, _hasHydrated]);

  // Fetch functions
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiKeysApi.getApiKeys(sessionId);
      setApiKeys(data);
      
      if (data.length === 0) {
        setShowOnboarding(true);
        setOnboardingStep('welcome');
      } else {
        setShowOnboarding(false);
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraces = async () => {
    try {
      setTracesLoading(true);
      const data = await dashboardApi.getTraces(sessionId);
      setTraces(data);
    } catch (err) {
      console.error('Error fetching traces:', err);
    } finally {
      setTracesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getStats(sessionId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Handlers
  const handleGenerateFirstKey = async () => {
    try {
      const keyData = await apiKeysApi.createApiKey(`${projectName} - Default Key`, parseInt(sessionId));
      setNewApiKey(keyData.key);
      setShowOnboarding(false); // Exit onboarding
      setShowApiKeySidebar(true); // Open the sidebar
      await fetchApiKeys();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingStep('welcome');
  };

  const handleConfirmApiKey = () => {
    setShowApiKeySidebar(false);
    setNewApiKey(null);
  };

  const handleTraceClick = (trace) => {
    setSelectedTrace(trace);
    setShowTraceDetailSidebar(true);
  };

  const handleCloseTraceSidebar = () => {
    setShowTraceDetailSidebar(false);
    setSelectedTrace(null);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  // Show loading spinner
  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Onboarding view
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-24 max-w-3xl">
          <OnboardingWizard
            projectName={projectName}
            onboardingStep={onboardingStep}
            newApiKey={newApiKey}
            onGenerateKey={handleGenerateFirstKey}
            onComplete={handleCompleteOnboarding}
            copyToClipboard={copyToClipboard}
            copied={copied}
          />
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-lg mb-2">{projectName}</h1>
              <p className="body-sm text-muted-foreground">
                Session ID: {sessionId}
              </p>
            </div>
            {activeTab === 'overview' && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                >
                  {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced Metrics
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-border">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-2 body-md font-medium transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('traces')}
              className={`pb-4 px-2 body-md font-medium transition-colors relative ${
                activeTab === 'traces'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Traces
                {traces.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {traces.length}
                  </span>
                )}
              </div>
              {activeTab === 'traces' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Primary Metrics */}
            <PrimaryMetrics stats={stats} />

            {/* Analytics Charts */}
            {stats.runCount > 0 && (
              <div className="mb-8">
                <h2 className="heading-md mb-4">Analytics Overview</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <TokenDistributionChart 
                    inputTokens={stats.totalInputTokens || 0}
                    outputTokens={stats.totalOutputTokens || 0}
                    title="Token Distribution"
                    description="Breakdown of input vs output tokens"
                  />
                  <SuccessErrorChart 
                    successCount={stats.successCount || 0}
                    errorCount={stats.errorCount || 0}
                    title="Success vs Errors"
                    description="Run status distribution"
                  />
                </div>
                
                {stats.toolBreakdown && stats.toolBreakdown.length > 0 && (
                  <div className="mb-6">
                    <ToolBreakdownChart 
                      toolBreakdown={stats.toolBreakdown}
                      title="Tool Usage"
                      description="Distribution of tool calls"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Advanced Metrics (Collapsible) */}
            {showAdvancedMetrics && <AdvancedMetrics stats={stats} />}
          </>
        )}

        {/* Traces Tab Content */}
        {activeTab === 'traces' && (
          <TracesTable
            traces={traces}
            tracesLoading={tracesLoading}
            apiKeysCount={apiKeys.length}
            onTraceClick={handleTraceClick}
          />
        )}
      </div>

      {/* API Key Sidebar */}
      <ApiKeySidebar
        isOpen={showApiKeySidebar}
        newApiKey={newApiKey}
        projectName={projectName}
        onConfirm={handleConfirmApiKey}
        copyToClipboard={copyToClipboard}
        copied={copied}
      />

      {/* Trace Detail Sidebar */}
      <TraceDetailSidebar
        isOpen={showTraceDetailSidebar}
        trace={selectedTrace}
        onClose={handleCloseTraceSidebar}
      />
    </div>
  );
}
