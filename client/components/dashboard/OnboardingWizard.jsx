'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Key, ArrowRight, Check, Copy } from 'lucide-react';

export default function OnboardingWizard({ 
  projectName, 
  onboardingStep, 
  newApiKey, 
  onGenerateKey,
  onComplete,
  copyToClipboard,
  copied 
}) {
  const [hasConfirmedSave, setHasConfirmedSave] = useState(false);

  const handleComplete = () => {
    if (!hasConfirmedSave) {
      alert('Please confirm you have saved your API key');
      return;
    }
    onComplete();
  };

  if (onboardingStep === 'welcome') {
    return (
      <Card className="glass-effect border-border">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-primary" />
          </div>
          <h1 className="heading-lg mb-4">Welcome to {projectName}!</h1>
          <p className="body-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Let's get you started by generating your first API key to begin tracking your AI application.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={onGenerateKey}
          >
            Generate API Key
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (onboardingStep === 'setup' && newApiKey) {
    return (
      <Card className="glass-effect border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-6 h-6 text-green-500" />
            <CardTitle className="heading-lg">API Key Created!</CardTitle>
          </div>
          <CardDescription className="body-md text-yellow-600 dark:text-yellow-400 font-medium">
            ⚠️ IMPORTANT: Save this key now. You won't be able to see it again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Display */}
          <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4">
            <p className="body-sm font-medium mb-3">Your API Key:</p>
            <div className="relative">
              <pre className="bg-background rounded-lg p-4 overflow-x-auto body-sm font-mono">
                {newApiKey}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(newApiKey, 'newKey')}
              >
                {copied.newKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div>
            <h3 className="heading-sm mb-3">1. Install Kyra SDK</h3>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto body-sm">
                <code>npm install kyra-observability-sdk</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard('npm install kyra-observability-sdk', 'install')}
              >
                {copied.install ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="heading-sm mb-3">2. Create .env file</h3>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto body-sm">
                <code>{`# Required
KYRA_API_KEY=${newApiKey}
KYRA_ENDPOINT=http://localhost:3002/api
KYRA_PROJECT=${projectName}
OPENAI_API_KEY=sk-your_openai_key_here

# Optional
KYRA_TRACING=true`}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`# Required
KYRA_API_KEY=${newApiKey}
KYRA_ENDPOINT=http://localhost:3002/api
KYRA_PROJECT=${projectName}
OPENAI_API_KEY=sk-your_openai_key_here

# Optional
KYRA_TRACING=true`, 'env')}
              >
                {copied.env ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <h3 className="heading-sm mb-3">3. Use in your code</h3>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto body-sm">
                <code>{`require('dotenv').config();
const Kyra = require('kyra-observability-sdk');

const sdk = new Kyra();

async function main() {
  const response = await sdk.chatCompletions({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
  
  console.log(response.choices[0].message.content);
}

main();`}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`require('dotenv').config();
const Kyra = require('kyra-observability-sdk');

const sdk = new Kyra();

async function main() {
  const response = await sdk.chatCompletions({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
  
  console.log(response.choices[0].message.content);
}

main();`, 'code')}
              >
                {copied.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="border-t border-border pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConfirmedSave}
                onChange={(e) => setHasConfirmedSave(e.target.checked)}
                className="w-5 h-5 rounded border-border"
              />
              <span className="body-md">I have saved my API key securely</span>
            </label>
          </div>

          {/* Continue Button */}
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleComplete}
            disabled={!hasConfirmedSave}
          >
            Continue to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

