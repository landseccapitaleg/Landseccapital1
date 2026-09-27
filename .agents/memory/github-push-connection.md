---
name: GitHub push connection
description: Replit Git synchronization and direct HTTPS push behavior after changing repositories.
---

After switching the connected GitHub repository in Replit, the workspace can update the origin remote and synchronize the current branch even when a direct local HTTPS push rejects the available credential.

**Why:** The Replit Git connection and the shell's GitHub credential are separate authentication paths.

**How to apply:** Check the origin URL, branch tracking state, and commit hash before retrying direct pushes. If origin/main already matches HEAD, do not create another commit or ask for a token in chat; proceed with deployment guidance.