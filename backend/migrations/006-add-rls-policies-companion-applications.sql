-- Enable RLS on companion_applications table
ALTER TABLE companion_applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT their own applications
CREATE POLICY insert_own_applications ON companion_applications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy 2: Users can SELECT their own applications
CREATE POLICY select_own_applications ON companion_applications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy 3: Admins can SELECT all applications
CREATE POLICY admins_select_all_applications ON companion_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy 4: Admins can UPDATE applications
CREATE POLICY admins_update_applications ON companion_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy 5: Admins can DELETE applications
CREATE POLICY admins_delete_applications ON companion_applications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
