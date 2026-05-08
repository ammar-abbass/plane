# Data Model

## Entities

| Entity    | Description                                  |
| --------- | -------------------------------------------- |
| Workspace | Top-level isolation boundary                 |
| Member    | User membership in a workspace with role     |
| Project   | Container for issues                         |
| Issue     | Unit of work with status, priority, assignee |
| Label     | Tag scoped to a project                      |
| Comment   | Text response on an issue                    |
| Activity  | Immutable log of issue changes               |

## Relationships

- Workspace has many Members
- Workspace has many Projects
- Workspace has many Issues
- Project has many Issues
- Project has many Labels
- Issue has many Labels (via join table)
- Issue has many Comments
- Issue has many Activity entries
