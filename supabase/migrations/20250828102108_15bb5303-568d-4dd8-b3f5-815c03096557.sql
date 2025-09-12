
CREATE TABLE public.ai_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their own history" 
ON public.ai_history 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own history" 
ON public.ai_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


CREATE INDEX idx_ai_history_user_id_created_at ON public.ai_history(user_id, created_at DESC);
CREATE INDEX idx_ai_history_created_at ON public.ai_history(created_at DESC);