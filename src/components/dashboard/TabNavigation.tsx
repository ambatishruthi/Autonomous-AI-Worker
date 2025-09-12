import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsCard } from "./NewsCard";
import { FinancialChart } from "./FinancialChart";

interface TabNavigationProps {
  newsData?: any;
  financialData?: any;
  onRefreshNews: () => void;
  onRefreshFinancial: () => void;
  onFinancialSymbolChange: (symbol: string, data: any) => void;
}

export function TabNavigation({ 
  newsData, 
  financialData, 
  onRefreshNews, 
  onRefreshFinancial,
  onFinancialSymbolChange 
}: TabNavigationProps) {
  return (
    <Tabs defaultValue="news" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="news" className="flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          News Insights
        </TabsTrigger>
        <TabsTrigger value="financial" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Financial Dashboard
        </TabsTrigger>
      </TabsList>

      <TabsContent value="news" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest News</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshNews}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        {newsData && newsData.articles && newsData.articles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsData.articles.map((article: any, index: number) => (
              <NewsCard key={index} article={article} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No news articles available</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Market Data</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshFinancial}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <FinancialChart
          symbol={financialData?.symbol}
          data={financialData?.data}
          dataType={financialData?.dataType}
          lastUpdated={financialData?.lastUpdated}
          onSymbolChange={onFinancialSymbolChange}
        />
      </TabsContent>
    </Tabs>
  );
}