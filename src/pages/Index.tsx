import { useState, useRef } from "react";
import { SetupScreen } from "@/components/setup/SetupScreen";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { askAI } from "@/lib/api";
import { fetchNews, fetchFinancialData } from "@/lib/externalApi";
import { useToast } from "@/hooks/use-toast";

const AI_MODEL_NAMES = {
  openai: "OpenAI GPT",
  gemini: "Google Gemini",
};

interface SetupData {
  llmProvider: string;
  apiKey: string;
  query: string;
}

const Index = () => {
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const handleSetupComplete = async (data: SetupData) => {
    setSetupData(data);
    setIsLoading(true);
    setDashboardData({});

    try {
      
      const queryLower = data.query.toLowerCase();
      let externalData = {};

      
      if (queryLower.includes('news') || queryLower.includes('headlines') || queryLower.includes('latest')) {
        try {
          const newsTopicMatch = queryLower.match(/news about (.+)|headlines (.+)|latest (.+)/);
          const topic = newsTopicMatch ? newsTopicMatch[1] || newsTopicMatch[2] || newsTopicMatch[3] : '';
          const newsData = await fetchNews(topic || undefined); 
          externalData = { news: newsData };
          setDashboardData(prev => ({ ...prev, ...externalData }));
        } catch (newsError) {
          console.warn('News fetch failed:', newsError);
          
          try {
            const trendingNews = await fetchNews();
            externalData = { news: trendingNews };
            setDashboardData(prev => ({ ...prev, ...externalData }));
          } catch (fallbackError) {
            console.warn('Trending news fallback failed:', fallbackError);
          }
        }
      }

      
      if (queryLower.includes('stock') || queryLower.includes('crypto') || queryLower.includes('price') || 
          queryLower.includes('market') || /\b([a-z]{1,5})\b/i.test(queryLower)) {
        try {
          
          const symbolMatches = queryLower.match(/\b([a-z]{1,5})\b/gi) || [];
          const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto'];
          const stockSymbols = symbolMatches.filter(symbol => 
            symbol.length >= 1 && symbol.length <= 5 && 
            !cryptoKeywords.includes(symbol.toLowerCase())
          );
          
          if (stockSymbols.length > 0 || cryptoKeywords.some(keyword => queryLower.includes(keyword))) {
            let symbol = 'AAPL'; 
            let dataType: 'stock' | 'crypto' = 'stock';
            
            if (cryptoKeywords.some(keyword => queryLower.includes(keyword))) {
              symbol = queryLower.includes('ethereum') || queryLower.includes('eth') ? 'ETH' : 'BTC';
              dataType = 'crypto';
            } else if (stockSymbols.length > 0) {
              symbol = stockSymbols[0].toUpperCase();
              localStorage.setItem('lastStockSymbol', symbol);
            }
            
            const financialData = await fetchFinancialData(symbol, dataType);
            externalData = { ...externalData, financial: financialData };
            setDashboardData(prev => ({ ...prev, financial: financialData }));
          } else {
            
            const cachedSymbol = localStorage.getItem('lastStockSymbol') || 'AAPL';
            const financialData = await fetchFinancialData(cachedSymbol, 'stock');
            externalData = { ...externalData, financial: financialData };
            setDashboardData(prev => ({ ...prev, financial: financialData }));
          }
        } catch (finError) {
          console.warn('Financial fetch failed:', finError);
        }
      }


     
      let fullResponse = "";
      
      
      let enhancedQuery = data.query;
      if (Object.keys(externalData).length > 0) {
        enhancedQuery += `\n\nAdditional context: ${JSON.stringify(externalData, null, 2)}`;
      }

      
      abortControllerRef.current = new AbortController();
      
      await askAI(
        {
          model: data.llmProvider,
          api_key: data.apiKey,
          query: enhancedQuery,
        },
        (chunk) => {
          fullResponse += chunk;
          setDashboardData(prev => ({ ...prev, aiResponse: fullResponse }));
        }
      );

      setIsSetupMode(false);

      toast({
        description: "🚀 Knowledge Worker activated successfully!",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        description: "Failed to process request. Please check your API key and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    toast({
      description: "⏹️ Processing stopped",
    });
  };

  const handleRefreshNews = async () => {
    if (!setupData) return;
    
    try {
      const newsData = await fetchNews();
      setDashboardData(prev => ({ ...prev, news: newsData }));
      toast({
        description: "📰 News refreshed successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to refresh news data",
      });
    }
  };

  const handleRefreshFinancial = async () => {
    if (!setupData) return;
    
    try {
      
      const cachedSymbol = localStorage.getItem('lastStockSymbol') || 'AAPL';
      const financialData = await fetchFinancialData(cachedSymbol, 'stock');
      setDashboardData(prev => ({ ...prev, financial: financialData }));
      toast({
        description: "📈 Financial data refreshed successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to refresh financial data",
      });
    }
  };

  const handleFinancialSymbolChange = (symbol: string, data: any) => {
    setDashboardData(prev => ({ ...prev, financial: data }));
  };

  const handleBackToSetup = () => {
    setIsSetupMode(true);
    setDashboardData({});
    setSetupData(null);
    handleStop();
  };

  if (isSetupMode) {
    return (
      <SetupScreen
        onSetupComplete={handleSetupComplete}
        isLoading={isLoading}
      />
    );
  }

  return (
    <DashboardLayout
      data={dashboardData}
      isLoading={isLoading}
      onStop={handleStop}
      onRefreshNews={handleRefreshNews}
      onRefreshFinancial={handleRefreshFinancial}
      onFinancialSymbolChange={handleFinancialSymbolChange}
      onBackToSetup={handleBackToSetup}
      modelName={AI_MODEL_NAMES[setupData?.llmProvider as keyof typeof AI_MODEL_NAMES] || setupData?.llmProvider || ""}
    />
  );
};

export default Index;