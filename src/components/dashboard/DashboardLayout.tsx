import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsCard } from "./NewsCard";
import { FinancialChart } from "./FinancialChart";
import { StreamingResponse } from "./StreamingResponse";
import { TabNavigation } from "./TabNavigation";
import { ArrowLeft, RefreshCw, Newspaper, TrendingUp, Brain } from "lucide-react";
import { useEffect } from "react";

interface DashboardLayoutProps {
  data: any;
  isLoading: boolean;
  onStop: () => void;
  onRefreshNews: () => void;
  onRefreshFinancial: () => void;
  onBackToSetup: () => void;
  onFinancialSymbolChange: (symbol: string, data: any) => void;
  modelName: string;
}

export function DashboardLayout({ 
  data, 
  isLoading, 
  onStop, 
  onRefreshNews, 
  onRefreshFinancial, 
  onBackToSetup,
  onFinancialSymbolChange,
  modelName 
}: DashboardLayoutProps) {
  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefreshNews) onRefreshNews();
      if (onRefreshFinancial) onRefreshFinancial();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [onRefreshNews, onRefreshFinancial]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBackToSetup}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Setup
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Knowledge Dashboard
              </h1>
              <p className="text-muted-foreground">Real-time insights powered by {modelName}</p>
            </div>
          </div>
        </div>

        {/* AI Response Section */}
        <div className="animate-fade-in-up">
          <StreamingResponse
            response={data.aiResponse || ""}
            isLoading={isLoading}
            onStop={onStop}
            modelName={modelName}
          />
        </div>

        {/* Tab Navigation for Data */}
        <TabNavigation
          newsData={data.news}
          financialData={data.financial}
          onRefreshNews={onRefreshNews}
          onRefreshFinancial={onRefreshFinancial}
          onFinancialSymbolChange={onFinancialSymbolChange}
        />

      </div>
    </div>
  );
}