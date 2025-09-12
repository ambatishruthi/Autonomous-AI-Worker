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
    let topic: string | null = null;
    let country = "us";
    let pageSize = 5; 

    if (req.method === "POST") {
      const body = await req.json();
      topic = body.topic || null;
      country = body.country || "us";
      pageSize = body.pageSize || 5;
    } else {
      const url = new URL(req.url);
      topic = url.searchParams.get("topic");
      country = url.searchParams.get("country") || "us";
      pageSize = parseInt(url.searchParams.get("pageSize") || "5");
    }

    const newsApiKey = Deno.env.get("NEWSAPI_KEY");
    if (!newsApiKey) throw new Error("NewsAPI key not configured");

    
    let apiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${newsApiKey}`;
    if (topic && topic.trim()) {
      apiUrl += `&q=${encodeURIComponent(topic)}`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Failed to fetch news");

    // Extract articles
    let articles = data.articles
      .filter((a: any) => a.title && a.description)
      .map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage,
        publishedAt: a.publishedAt,
        source: a.source.name,
        content: a.content,
      }));

    
    if (!topic || articles.length === 0) {
      const fallbackResponse = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${newsApiKey}`
      );
      const fallbackData = await fallbackResponse.json();
      articles = fallbackData.articles
        .filter((a: any) => a.title && a.description)
        .map((a: any) => ({
          title: a.title,
          description: a.description,
          url: a.url,
          urlToImage: a.urlToImage,
          publishedAt: a.publishedAt,
          source: a.source.name,
          content: a.content,
        }));
    }

    return new Response(
      JSON.stringify({
        articles,
        totalResults: articles.length,
        status: "success",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("News API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, status: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
