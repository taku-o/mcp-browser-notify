# Container-Use Off

Return to standard development tools (Default)

## Description

**IMPORTANT**: This command disables Container-Use environment and returns to standard Claude Code tools.

**Behavior after this command:**
- Use standard tools (Read, Write, Edit, Bash, etc.) for all operations
- NO Container-Use tools (mcp__container-use__*) should be used
- Standard Git operations using Bash tool
- Direct file system access using standard file tools

This is the default and recommended approach for most development tasks including file operations, code changes, and shell commands. Container-Use environment is now disabled until `/container-use-on` is called again.