-- sessions_own's WITH CHECK only verified user_id = auth.uid(), so any
-- signed-in user could attach a project_id they have no membership in,
-- incorrectly rolling into that project's completed_count.
-- Require project membership (organizer or chanter) when project_id is set.
DROP POLICY sessions_own ON sessions;

CREATE POLICY sessions_own ON sessions FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      project_id IS NULL
      OR is_project_member(project_id)
      OR EXISTS (SELECT 1 FROM projects p
                 WHERE p.id = project_id AND p.organizer_id = (SELECT auth.uid()))
    )
  );
