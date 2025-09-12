import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get("symbol") || "TATAMOTORS.BSE").toUpperCase();
    const interval = url.searchParams.get("interval") || "daily";

    const alphaVantageKey = Deno.env.get("ALPHA_VANTAGE_KEY");
    if (!alphaVantageKey) {
      return new Response(
        JSON.stringify({ status: "error", error: "Alpha Vantage API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const functionName = interval === "intraday" ? "TIME_SERIES_INTRADAY" : "TIME_SERIES_DAILY";
    let apiUrl = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${alphaVantageKey}&outputsize=compact`;
    if (functionName === "TIME_SERIES_INTRADAY") apiUrl += "&interval=5min";

    const response = await fetch(apiUrl); // native fetch
    const data = await response.json();

    let formattedData;

    if (data["Error Message"] || data["Note"] || !Object.keys(data).some(k => k.includes("Time Series"))) {
      const defaultData = [
        { date: "2025-09-11", open: 709, high: 712, low: 704, close: 705, volume: 273053 },
        { date: "2025-09-10", open: 710, high: 715, low: 705, close: 710, volume: 200000 },
        { date: "2025-09-09", open: 715, high: 718, low: 710, close: 712, volume: 250000 },
      ];
      formattedData = {
        symbol: "TATAMOTORS.BSE",
        interval,
        lastUpdated: defaultData[0].date,
        data: defaultData,
        fallback: true,
      };
    } else {
      const timeSeriesKey = Object.keys(data).find((k) => k.includes("Time Series"));
      const timeSeries = data[timeSeriesKey];
      const dates = Object.keys(timeSeries).slice(0, 30);
      formattedData = {
        symbol,
        interval,
        lastUpdated: data["Meta Data"]?.["3. Last Refreshed"] || dates[0],
        data: dates.map((date) => {
          const day = timeSeries[date];
          return {
            date,
            open: parseFloat(day["1. open"] || 0),
            high: parseFloat(day["2. high"] || 0),
            low: parseFloat(day["3. low"] || 0),
            close: parseFloat(day["4. close"] || 0),
            volume: parseInt(day["5. volume"] || 0),
          };
        }),
        fallback: false,
      };
    }

    return new Response(JSON.stringify({ status: "success", ...formattedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", error: "Unexpected error: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
