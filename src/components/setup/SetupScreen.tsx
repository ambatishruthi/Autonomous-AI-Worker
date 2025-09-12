import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Key, Zap, Sparkles } from "lucide-react";

const LLM_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI GPT",
    description: "Most versatile and capable AI model",
    icon: Brain,
    color: "text-emerald-500"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Fast and efficient with excellent reasoning",
    icon: Sparkles,
    color: "text-blue-500"
  }
];

interface SetupData {
  llmProvider: string;
  apiKey: string;
  query: string;
}

interface SetupScreenProps {
  onSetupComplete: (data: SetupData) => void;
  isLoading: boolean;
}

export function SetupScreen({ onSetupComplete, isLoading }: SetupScreenProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState("");

  const selectedProviderInfo = LLM_PROVIDERS.find(p => p.id === selectedProvider);
  const isFormValid = selectedProvider && apiKey.trim() && query.trim();

  const handleSubmit = () => {
    if (!isFormValid) return;
    
    onSetupComplete({
      llmProvider: selectedProvider,
      apiKey: apiKey.trim(),
      query: query.trim()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Knowledge Worker
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Configure your AI assistant to analyze news, financial data, and market insights with intelligent responses
          </p>
        </div>

        {/* Setup Form */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-primary" />
              Setup Your Knowledge Worker
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* LLM Provider Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose AI Model</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select an AI provider..." />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-3 py-2">
                        <provider.icon className={`h-5 w-5 ${provider.color}`} />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {provider.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProviderInfo && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <selectedProviderInfo.icon className={`h-4 w-4 ${selectedProviderInfo.color}`} />
                  <span className="text-sm text-muted-foreground">
                    Selected: {selectedProviderInfo.name}
                  </span>
                </div>
              )}
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key (stored locally only)
              </Label>
              <Input
                type="password"
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                🔒 Your API key is never stored or sent to our servers
              </p>
            </div>

            {/* Query Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Your Query</Label>
              <Textarea
                placeholder="What would you like to know? (e.g., 'Latest tech news and AAPL stock analysis')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Run Knowledge Worker
                </div>
              )}
            </Button>

            {!isFormValid && (
              <p className="text-center text-sm text-muted-foreground">
                Please select an AI model, enter your API key, and provide a query
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}