-- Create a table for user content creations
CREATE TABLE public.user_creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_type TEXT NOT NULL, -- 'thumbnail' or 'video'
  title TEXT,
  prompt TEXT NOT NULL,
  result_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_creations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access - users can only see their own data
CREATE POLICY "Users can view their own creations" 
ON public.user_creations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creations" 
ON public.user_creations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creations" 
ON public.user_creations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creations" 
ON public.user_creations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_creations_updated_at
BEFORE UPDATE ON public.user_creations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_user_creations_user_id ON public.user_creations(user_id);
CREATE INDEX idx_user_creations_tool_type ON public.user_creations(tool_type);