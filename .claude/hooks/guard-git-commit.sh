#!/bin/bash
# guard-git-commit.sh
# PreToolUse hook for Bash
# Runs npm test before allowing git commit. Blocks commit if tests fail.

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$COMMAND" ]; then
    exit 0
fi

# Only intercept git commit (not git add, git status, etc.)
if echo "$COMMAND" | grep -qE "git commit"; then
    cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

    TEST_OUTPUT=$(npm test 2>&1)
    TEST_EXIT=$?

    if [ $TEST_EXIT -ne 0 ]; then
        echo "BLOCKED: Tests failed. Fix failing tests before committing." >&2
        echo "$TEST_OUTPUT" | tail -20 >&2
        exit 2
    fi
fi

exit 0
