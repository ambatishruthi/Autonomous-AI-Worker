import { useState, useEffect } from "react";
import { Copy, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ResponseDisplayProps {
  response: string;
  isLoading: boolean;
  modelName: string;
}

export function ResponseDisplay({ response, isLoading, modelName }: ResponseDisplayProps) {
  const [displayText, setDisplayText] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const { toast } = useToast();

  // Typewriter effect
  useEffect(() => {
    if (!response) {
      setDisplayText("");
      return;
    }

    let index = 0;
    setDisplayText("");
    
    const timer = setInterval(() => {
      if (index < response.length) {
        setDisplayText(response.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [response]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      toast({
        description: "Response copied to clipboard! 📋",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy response",
      });
    }
  };

  const handleExport = () => {
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      description: "Response exported successfully! 📁",
    });
  };

  if (!response && !isLoading) return null;

  return (
    <Card className="animate-fade-in-up shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
            {modelName} Response
          </CardTitle>
          {response && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {showCopied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 p-8 text-muted-foreground">
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            <span>Your AI Knowledge Worker is thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-foreground bg-muted/30 p-4 rounded-lg overflow-auto">
              {displayText}
              {displayText.length < response.length && (
                <span className="animate-pulse">|</span>
              )}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}