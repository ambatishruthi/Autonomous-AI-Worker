import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QueryInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function QueryInput({ 
  query, 
  onQueryChange, 
  onSubmit, 
  isLoading, 
  disabled 
}: QueryInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <label className="text-sm font-medium text-foreground">
          What would you like your AI to help with? ✨
        </label>
      </div>

      <Card className={`transition-smooth ${isFocused ? 'shadow-glow border-primary/50' : 'shadow-soft'}`}>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything... e.g., 'Summarize the latest AI trends' or 'Write a Python script to process CSV files'"
              className="w-full min-h-[120px] p-4 bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground focus:outline-none"
              disabled={disabled}
            />
            <div className="flex justify-between items-center p-4 pt-0">
              <div className="text-xs text-muted-foreground">
                {query.length > 0 && `${query.length} characters`}
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={!query.trim() || disabled || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    🚀 Run My Knowledge Worker
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}