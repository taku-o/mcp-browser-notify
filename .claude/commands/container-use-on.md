# Container-Use On

Enable Container-Use development environment

## Description

**IMPORTANT**: When this command is executed, Claude MUST use Container-Use environment tools (mcp__container-use__*) exclusively for ALL subsequent operations until `/container-use-off` is called.

**Mandatory behavior when Container-Use is enabled:**
- ALL file operations MUST use `mcp__container-use__environment_file_*` tools
- ALL command execution MUST use `mcp__container-use__environment_run_cmd`
- Git operations are handled automatically by the Container-Use environment
- NO standard tools (Read, Write, Edit, Bash) should be used
- First action should be to open/create environment with `mcp__container-use__environment_open`

This mode provides environment isolation and automatic Git operations. The user has explicitly requested Container-Use environment, so it must be used regardless of task complexity.