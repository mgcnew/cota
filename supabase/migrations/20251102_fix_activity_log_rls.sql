-- Fix activity_log RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view company activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can create company activity log" ON activity_log;

-- Create new policies with better error handling
CREATE POLICY "Users can view company activity log"
ON activity_log FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create company activity log"
ON activity_log FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT ON activity_log TO authenticated;
