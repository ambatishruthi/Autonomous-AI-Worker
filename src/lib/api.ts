import { supabase } from "@/integrations/supabase/client";

export interface AskRequest {
  model: string;
  api_key: string;
  query: string;
}

export interface StreamResponse {
  content: string;
}

export async function askAI(
  request: AskRequest,
  onChunk: (content: string) => void
): Promise<string> {
  try {
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    
    if (session?.access_token) {
      headers['authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch('https://yhweczutxgpathsazuhy.supabase.co/functions/v1/ask', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get AI response');
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Handle JSON response (non-streaming fallback)
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data.text) {
        onChunk(data.text);
        return data.text;
      }
      throw new Error('No text in response');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Handle SSE format
      if (chunk.includes('data: ')) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                onChunk(data.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      } else {
        // Handle raw text chunks
        fullResponse += chunk;
        onChunk(chunk);
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Error calling AI:', error);
    throw error;
  }
}

export async function getHistory() {
  try {
    const { data, error } = await supabase
      .from('ai_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}