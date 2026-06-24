-- Migration script for moving localStorage data to Supabase

CREATE TABLE IF NOT EXISTS public.user_evaluations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id text NOT NULL,
    user_id uuid NOT NULL,
    user_display_name text,
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bill_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id text NOT NULL,
    reply_type text NOT NULL CHECK (reply_type IN ('expert', 'citizen')),
    content text NOT NULL,
    source_url text,
    author_name text NOT NULL,
    verified_count integer DEFAULT 0,
    needs_review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_blind_votes (
    user_id uuid NOT NULL,
    quiz_id text NOT NULL,
    vote_type text NOT NULL CHECK (vote_type IN ('agree', 'disagree', 'hold')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, quiz_id)
);

CREATE TABLE IF NOT EXISTS public.user_question_votes (
    user_id uuid NOT NULL,
    question_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, question_id)
);

-- Note: RLS policies should be added here to restrict access to user-specific data.

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    display_name text,
    trust_level integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

