-- Enable RLS on companion_chat_requests table
ALTER TABLE public.companion_chat_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create chat requests for themselves
CREATE POLICY "Users can create chat requests for themselves"
ON public.companion_chat_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own chat requests (as requester)
CREATE POLICY "Users can view their own chat requests"
ON public.companion_chat_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Companions can view requests sent to them
CREATE POLICY "Companions can view requests sent to them"
ON public.companion_chat_requests
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.companions WHERE id = companion_chat_requests.companion_id
  )
);

-- Policy: Companions can approve/reject requests sent to them
CREATE POLICY "Companions can approve requests sent to them"
ON public.companion_chat_requests
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.companions WHERE id = companion_chat_requests.companion_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.companions WHERE id = companion_chat_requests.companion_id
  )
);
