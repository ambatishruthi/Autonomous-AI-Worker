import { TrendingUp, TrendingDown, DollarSign, BarChart3, Search, AlertCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { fetchFinancialData } from "@/lib/externalApi";
import { useToast } from "@/hooks/use-toast";

interface FinancialData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FinancialChartProps {
  symbol?: string;
  data?: FinancialData[];
  dataType?: string;
  lastUpdated?: string;
  compact?: boolean;
  onSymbolChange?: (symbol: string, data: any) => void;
}

export function FinancialChart({ symbol: initialSymbol, data: initialData, dataType: initialDataType, lastUpdated: initialLastUpdated, compact = false, onSymbolChange }: FinancialChartProps) {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [currentSymbol, setCurrentSymbol] = useState(initialSymbol || "");
  const [financialData, setFinancialData] = useState(initialData);
  const [dataType, setDataType] = useState(initialDataType || "stock");
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load cached symbol from localStorage on mount
  useEffect(() => {
    const cachedSymbol = localStorage.getItem('lastStockSymbol');
    if (cachedSymbol && !initialSymbol) {
      setCurrentSymbol(cachedSymbol);
      setSearchSymbol(cachedSymbol);
      handleSymbolSearch(cachedSymbol);
    } else if (!initialSymbol) {
      // Default to AAPL if no symbol
      setCurrentSymbol("AAPL");
      setSearchSymbol("AAPL");
      handleSymbolSearch("AAPL");
    }
  }, []);

  const currentPrice = financialData?.[0]?.close || 0;
  const previousPrice = financialData?.[1]?.close || 0;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;
  const isPositive = change >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const handleSymbolSearch = useCallback(async (symbol: string) => {
    if (!symbol.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const symbolUpper = symbol.trim().toUpperCase();
      const isStockSymbol = /^[A-Z]{1,5}$/.test(symbolUpper);
      const isCrypto = ['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'DOT', 'LINK', 'BCH', 'XLM', 'DOGE'].includes(symbolUpper);
      
      const type = isCrypto ? 'crypto' : 'stock';
      const response = await fetchFinancialData(symbolUpper, type, 'daily');
      
      setFinancialData(response.data);
      setDataType(response.dataType);
      setLastUpdated(response.lastUpdated);
      setCurrentSymbol(symbolUpper);
      
      // Cache the symbol
      localStorage.setItem('lastStockSymbol', symbolUpper);
      
      // Notify parent component
      onSymbolChange?.(symbolUpper, response);
      
      toast({
        description: `📈 Loaded ${symbolUpper} data successfully!`,
      });
    } catch (err: any) {
      console.error('Financial data error:', err);
      setError(err.message || 'Failed to fetch financial data');
      toast({
        variant: "destructive",
        description: "Failed to fetch financial data. Please check the symbol or try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSymbolChange, toast]);

  // Debounced search
  useEffect(() => {
    if (!searchSymbol.trim()) return;
    
    const timeoutId = setTimeout(() => {
      if (searchSymbol.trim() !== currentSymbol) {
        handleSymbolSearch(searchSymbol);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchSymbol, currentSymbol, handleSymbolSearch]);

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {currentSymbol.toUpperCase()}
            </h4>
            <p className="text-xs text-muted-foreground">
              {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(currentPrice)}
            </div>
            <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isPositive ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">High:</span>
            <span className="font-medium text-success">{formatCurrency(financialData?.[0]?.high || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-medium text-destructive">{formatCurrency(financialData?.[0]?.low || 0)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Financial Dashboard
          </CardTitle>
        </div>
        
        {/* Stock Symbol Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Stock Symbol, e.g., AAPL, MSFT, BTC"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => handleSymbolSearch(searchSymbol)}
            disabled={isLoading || !searchSymbol.trim()}
            variant="outline"
          >
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <p className="font-medium text-destructive">Error Loading Data</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleSymbolSearch(currentSymbol)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Loader className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading financial data...</p>
            </div>
          </div>
        ) : financialData && financialData.length > 0 ? (
          <>
            {/* Current Price Display */}
            <div className="flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg">
              <div>
                <h3 className="text-2xl font-bold">{currentSymbol.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground">
                  {dataType.charAt(0).toUpperCase() + dataType.slice(1)} • Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(currentPrice)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{isPositive ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* OHLCV Data */}
            <div className="grid grid-cols-4 gap-4 text-center mb-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="font-semibold">{formatCurrency(financialData[0]?.open || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">High</p>
                <p className="font-semibold text-success">{formatCurrency(financialData[0]?.high || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="font-semibold text-destructive">{formatCurrency(financialData[0]?.low || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-semibold">{formatVolume(financialData[0]?.volume || 0)}</p>
              </div>
            </div>

            {/* Simple Line Chart Visualization */}
            <div className="space-y-4">
              <h4 className="font-medium">Price Chart (Last 30 Days)</h4>
              <div className="h-32 bg-muted/30 rounded-lg p-4 relative overflow-hidden">
                <div className="flex items-end h-full justify-between gap-1">
                  {financialData.slice(0, 30).reverse().map((item, index) => {
                    const maxPrice = Math.max(...financialData.slice(0, 30).map(d => d.close));
                    const minPrice = Math.min(...financialData.slice(0, 30).map(d => d.close));
                    const height = ((item.close - minPrice) / (maxPrice - minPrice)) * 100;
                    
                    return (
                      <div
                        key={index}
                        className="bg-primary/70 hover:bg-primary transition-colors rounded-sm"
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          width: `${100 / 30}%`
                        }}
                        title={`${new Date(item.date).toLocaleDateString()}: ${formatCurrency(item.close)}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Price History */}
            <div className="space-y-2">
              <h4 className="font-medium">Recent Price History</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {financialData.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1 hover:bg-muted/30 px-2 rounded">
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                    <span className="font-medium">{formatCurrency(item.close)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a stock symbol to view financial data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}