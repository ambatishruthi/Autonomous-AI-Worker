import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Square, Copy, Check } from "lucide-react";

interface StreamingResponseProps {
  response: string;
  isLoading: boolean;
  onStop?: () => void;
  modelName: string;
}

export function StreamingResponse({ response, isLoading, onStop, modelName }: StreamingResponseProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout>();

  // Typewriter effect
  useEffect(() => {
    if (response && currentIndex < response.length) {
      typewriterRef.current = setTimeout(() => {
        setDisplayedText(response.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Adjust speed here (lower = faster)
    }

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [response, currentIndex]);

  // Reset when new response starts
  useEffect(() => {
    if (response !== displayedText) {
      setCurrentIndex(0);
      setDisplayedText("");
    }
  }, [response]);

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(response);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isStreaming = isLoading && displayedText.length > 0;
  const showCursor = isStreaming || (isLoading && displayedText.length === 0);

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Response ({modelName})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {response && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            )}
            
            {isLoading && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && displayedText.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">AI is thinking...</p>
            </div>
          </div>
        ) : response || displayedText ? (
          <div className="relative">
            <div className="bg-muted/30 rounded-lg p-6 border">
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {displayedText}
                  {showCursor && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                  )}
                </pre>
              </div>
            </div>
            
            {isStreaming && (
              <div className="absolute bottom-4 right-4">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Streaming...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>AI response will appear here with typewriter effect</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}