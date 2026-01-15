-- Add DELETE policy for delegates table to allow users to delete their own delegate info
CREATE POLICY "Users can delete their own delegate info"
ON public.delegates FOR DELETE
USING (auth.uid() = user_id);