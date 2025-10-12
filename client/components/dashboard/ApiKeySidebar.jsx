'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, X } from 'lucide-react';

export default function ApiKeySidebar({ isOpen, newApiKey, projectName, onConfirm, copyToClipboard, copied }) {
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!hasConfirmed) return;
    setHasConfirmed(false);
    onConfirm();
  };

  // Don't render at all if no API key yet
  if (!newApiKey) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => {
          e.preventDefault();
          // Only allow backdrop click to close if confirmed
          if (hasConfirmed) {
            handleConfirm();
          }
        }}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-6 h-6 text-green-500" />
                <h2 className="heading-lg">API Key Created!</h2>
              </div>
              <p className="body-sm text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ IMPORTANT: Save this key now. You won't be able to see it again.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* API Key Display */}
          <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4">
            <p className="body-sm font-medium mb-3">Your API Key:</p>
            <div className="relative">
              <pre className="bg-background rounded-lg p-4 overflow-x-auto body-sm font-mono break-all whitespace-pre-wrap">
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
            <h3 className="heading-sm mb-3">2. Update your .env file</h3>
            <div className="relative">
              <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto body-sm">
                <code>{`# Required
KYRA_API_KEY=${newApiKey}
KYRA_ENDPOINT=https://kitkat-production.up.railway.app/api
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
KYRA_ENDPOINT=https://kitkat-production.up.railway.app/api
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
        </div>

        {/* Footer with Checkbox and Confirm */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-6 py-4">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
              />
              <span className="body-md font-medium">I have securely saved my API key and environment variables</span>
            </label>

            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={!hasConfirmed}
            >
              {hasConfirmed ? 'Continue to Dashboard' : 'Please confirm you have saved your key'}
              <Check className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

