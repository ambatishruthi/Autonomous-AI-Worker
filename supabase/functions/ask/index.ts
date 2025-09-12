import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  model: string;
  api_key: string;
  query: string;
}

async function callOpenAI(apiKey: string, query: string, model: string): Promise<Response> {
  const openAIModel = model === 'gpt-4' ? 'gpt-4o' : 'gpt-4o-mini';
  
  return await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openAIModel,
      messages: [{ role: 'user', content: query }],
      stream: true,
      max_tokens: 1000,
    }),
  });
}

async function callGemini(apiKey: string, query: string, streaming: boolean = true): Promise<Response> {
  const endpoint = streaming 
    ? `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: query }] }],
    }),
  });
}

async function callClaude(apiKey: string, query: string): Promise<Response> {
 
  throw new Error('Claude is no longer supported. Please use OpenAI GPT or Google Gemini.');
}

async function saveToHistory(supabase: any, userId: string | null, model: string, query: string, response: string) {
  try {
    const { error } = await supabase
      .from('ai_history')
      .insert({
        user_id: userId,
        model,
        query,
        response,
      });
    
    if (error) {
      console.error('Error saving to history:', error);
    }
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { model, api_key, query }: RequestBody = await req.json();

    if (!model || !api_key || !query) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model, api_key, query' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://yhweczutxgpathsazuhy.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlod2VjenV0eGdwYXRoc2F6dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNzU0NTMsImV4cCI6MjA3MTk1MTQ1M30.6XKTMhtEsEXGaHfesIM7eO14KRZnpnFx3kaGSNna-L4';
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id || null;
      } catch (error) {
        console.log('No authenticated user, proceeding without user_id');
      }
    }

    let aiResponse: Response;
    let provider = 'unknown';

    
    if (model.startsWith('gpt') || model.includes('openai')) {
      provider = 'openai';
      aiResponse = await callOpenAI(api_key, query, model);
    } else if (model.includes('gemini') || model.includes('google')) {
      provider = 'gemini';
      aiResponse = await callGemini(api_key, query, true);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported model. Only OpenAI GPT and Google Gemini are supported.' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!aiResponse.ok) {
     
      if (provider === 'gemini') {
        console.log('Gemini streaming failed, trying non-streaming...');
        try {
          aiResponse = await callGemini(api_key, query, false);
          if (aiResponse.ok) {
            const data = await aiResponse.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullResponse = text;
              await saveToHistory(supabase, userId, model, query, text);
              return new Response(JSON.stringify({ text }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
        } catch (fallbackError) {
          console.error('Gemini fallback also failed:', fallbackError);
        }
      }
      
      console.error('AI Provider Error', { provider, status: aiResponse.status });
      return new Response(
        JSON.stringify({ error: 'Failed to get response from AI provider' }), 
        { 
          status: aiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    
    let fullResponse = '';
    const readable = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) return;

        const isOpenAI = model.startsWith('gpt') || model.includes('openai');
        const isGemini = model.includes('gemini') || model.includes('google');
        const isAnthropic = model.includes('claude') || model.includes('anthropic');
        let geminiBuffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            
            
            if (isOpenAI) {
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullResponse += content;
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch (_e) {
                    // Skip invalid JSON
                  }
                }
              }
            } else if (isGemini) {
              
              geminiBuffer += chunk;
              
             
              let startIndex = 0;
              while (startIndex < geminiBuffer.length) {
                const openBrace = geminiBuffer.indexOf('{', startIndex);
                if (openBrace === -1) break;
                
                let braceCount = 0;
                let endIndex = openBrace;
                
                
                for (let i = openBrace; i < geminiBuffer.length; i++) {
                  if (geminiBuffer[i] === '{') braceCount++;
                  if (geminiBuffer[i] === '}') braceCount--;
                  if (braceCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
                
                if (braceCount === 0) {
                  
                  const jsonStr = geminiBuffer.slice(openBrace, endIndex + 1);
                  try {
                    const obj = JSON.parse(jsonStr);
                    const candidates = obj.candidates || [];
                    for (const candidate of candidates) {
                      const parts = candidate.content?.parts || [];
                      for (const part of parts) {
                        const text = part.text || '';
                        if (text) {
                          fullResponse += text;
                          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                        }
                      }
                    }
                  } catch (parseError) {
                    console.log('Failed to parse Gemini chunk:', parseError);
                  }
                  startIndex = endIndex + 1;
                } else {
                  
                  break;
                }
              }
              
              
              if (startIndex > 0) {
                geminiBuffer = geminiBuffer.slice(startIndex);
              }
            } else {
             
              fullResponse += chunk;
              controller.enqueue(value);
            }
          }
          
          
          if (fullResponse.trim()) {
            await saveToHistory(supabase, userId, model, query, fullResponse.trim());
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ask function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});