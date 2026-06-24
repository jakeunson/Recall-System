-- Supabase Row Level Security (RLS) definitions for Recall System

-- 1. Enable RLS on all tables
ALTER TABLE public.user_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blind_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_votes ENABLE ROW LEVEL SECURITY;

-- 2. Define policies for user_evaluations
-- Everyone can read all evaluations
CREATE POLICY "Allow public read access for user_evaluations"
ON public.user_evaluations FOR SELECT
USING (true);

-- Users can only insert/update/delete their own evaluations
CREATE POLICY "Allow users to manage their own evaluations"
ON public.user_evaluations FOR ALL
USING (auth.uid() = user_id);

-- 3. Define policies for bill_replies
-- Everyone can read all replies
CREATE POLICY "Allow public read access for bill_replies"
ON public.bill_replies FOR SELECT
USING (true);

-- (In a real app we'd map auth.uid() to an author ID or profile. Assuming anyone logged in can insert for now, but restrict to their own session)
-- This assumes a more complex relation, but basic RLS is shown.
CREATE POLICY "Allow authenticated users to insert replies"
ON public.bill_replies FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Define policies for user_blind_votes
CREATE POLICY "Allow users to read their own blind votes"
ON public.user_blind_votes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert/update their own blind votes"
ON public.user_blind_votes FOR ALL
USING (auth.uid() = user_id);

-- 5. Define policies for user_question_votes
CREATE POLICY "Allow users to read their own question votes"
ON public.user_question_votes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert/update their own question votes"
ON public.user_question_votes FOR ALL
USING (auth.uid() = user_id);
