import { useState } from "react";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  modelName: string;
}

export function ApiKeyInput({ apiKey, onApiKeyChange, modelName }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <label className="text-sm font-medium text-foreground">
          {modelName} API Key 🔐
        </label>
      </div>
      
      <div className="relative">
        <Input
          type={showKey ? "text" : "password"}
          placeholder="Enter your API key..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="pr-10 bg-card border-border shadow-soft transition-smooth focus:shadow-glow"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-8 w-8"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Card className="border-success/20 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-success mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-success">Your data stays safe</h4>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally on your device and never sent to our servers. 
                It's only used to communicate directly with {modelName}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}