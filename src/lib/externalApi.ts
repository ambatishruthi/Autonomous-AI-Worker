import { supabase } from "@/integrations/supabase/client";

interface NewsResponse {
  articles: any[];
  totalResults: number;
  status: string;
}

interface FinancialResponse {
  symbol: string;
  data: any[];
  dataType: string;
  lastUpdated: string;
  status: string;
}

export async function fetchNews(topic?: string, country = 'us', pageSize = 10): Promise<NewsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('news', {
      body: { topic, country, pageSize }
    });

    if (error) {
      console.error('News API Error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
        throw new Error('Daily news quota exceeded. Please try again tomorrow.');
      }
      
      if (error.message?.includes('not configured') || error.message?.includes('API key')) {
        throw new Error('NewsAPI key not configured - please add your API key');
      }
      
      if (error.message?.includes('non-2xx status code')) {
        throw new Error('NewsAPI key invalid or not configured - please check your settings');
      }
      
      throw new Error('Live news temporarily unavailable - please try again');
    }

    // Handle error responses from the function
    if (data?.status === 'error') {
      if (data.error?.includes('quota') || data.error?.includes('exceeded')) {
        throw new Error('Daily news quota exceeded. Please try again tomorrow.');
      }
      if (data.error?.includes('not configured') || data.error?.includes('API key')) {
        throw new Error('NewsAPI key not configured - please add your API key');
      }
      throw new Error('Live news temporarily unavailable - please try again');
    }

    return data;
  } catch (error: any) {
    console.error('News fetch error:', error);
    throw new Error(error.message || 'Live news temporarily unavailable - please try again');
  }
}

export async function fetchFinancialData(
  symbol: string, 
  dataType: 'stock' | 'crypto' | 'forex' = 'stock',
  interval = 'daily'
): Promise<FinancialResponse> {
  if (!symbol?.trim()) {
    throw new Error('Please provide a valid symbol');
  }

  try {
    const { data, error } = await supabase.functions.invoke('financial', {
      body: { symbol, dataType, interval }
    });

    if (error) {
      console.error('Financial API Error:', error);
      
      // Handle specific HTTP status codes and error messages
      if (error.message?.includes('non-2xx status code')) {
        throw new Error('Alpha Vantage API key not configured or invalid - please check your settings');
      }
      
      if (error.message?.includes('API call frequency') || error.status === 429) {
        throw new Error('Provider rate limit reached, try again in 1 minute');
      }
      
      if (error.message?.includes('Invalid symbol') || error.status === 400) {
        throw new Error(`Invalid symbol: ${symbol.toUpperCase()}`);
      }
      
      if (error.message?.includes('not configured') || error.message?.includes('API key')) {
        throw new Error('Alpha Vantage API key not configured - please add your API key');
      }
      
      throw new Error('Live data temporarily unavailable - please try again');
    }

    // Handle error responses from the function
    if (data?.status === 'error') {
      if (data.error?.includes('API call frequency')) {
        throw new Error('Provider rate limit reached, try again in 1 minute');
      }
      if (data.error?.includes('Invalid symbol')) {
        throw new Error(`Invalid symbol: ${symbol.toUpperCase()}`);
      }
      if (data.error?.includes('not configured') || data.error?.includes('API key')) {
        throw new Error('Alpha Vantage API key not configured - please add your API key');
      }
      throw new Error(data.error || 'Live data temporarily unavailable');
    }

    return data;
  } catch (error: any) {
    console.error('Financial data error:', error);
    
    // Don't wrap user-friendly messages
    if (error.message?.includes('Provider rate limit') || 
        error.message?.includes('Invalid symbol') || 
        error.message?.includes('API key')) {
      throw error;
    }
    
    throw new Error('Live data temporarily unavailable - please try again');
  }
}