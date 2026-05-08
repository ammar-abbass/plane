export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'cancelled'

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'

export type ActivityAction =
  | 'issue.created'
  | 'issue.status_changed'
  | 'issue.priority_changed'
  | 'issue.assignee_changed'
  | 'issue.title_changed'
  | 'issue.due_date_changed'
  | 'label.added'
  | 'label.removed'
  | 'comment.added'
  | 'comment.deleted'

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } }

export type PageInput = {
  cursor?: string
  limit?: number
}

export type PageResult<T> = {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

export type IssueUpdate = {
  type: 'issue.created' | 'issue.updated' | 'issue.deleted'
  issueId: string
  projectId: string
  workspaceSlug: string
  changes: Partial<{
    title: string
    description: string | null
    status: IssueStatus
    priority: IssuePriority
    assigneeId: string | null
    dueDate: string | null
  }>
  actorId: string
  timestamp: string
}

export type SearchResult = {
  id: string
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  sequenceId: number
  projectId: string
}
