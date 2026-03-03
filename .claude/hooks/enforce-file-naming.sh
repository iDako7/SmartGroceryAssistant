#!/bin/bash
# enforce-file-naming.sh
# PreToolUse hook for Edit|Write
# Blocks creation of files that violate the project's naming conventions.
# Adapts to the conventions defined in CLAUDE.md:
#   Controllers: src/controller/{Name}Controller.ts
#   Services:    src/services/{Name}Service.ts
#   Repositories: src/repositories/{Name}Repository.ts
#   Routes:      src/routes/{name}.routes.ts
#   DTOs:        src/dtos/response/{Name}DTO.ts
#   Constants:   src/constants/{name}.ts
#   Validation:  src/validation/{name}Validation.ts

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    fp = data.get('tool_input', {}).get('file_path', '')
    if not fp:
        fp = data.get('tool_input', {}).get('file', '')
    print(fp)
except:
    print('')
" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only check files in src/
echo "$FILE_PATH" | grep -q "^src/" || exit 0
# Skip non-TypeScript files
echo "$FILE_PATH" | grep -qE "\.tsx?$" || exit 0

BASENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")

VIOLATION=""

case "$DIRNAME" in
    src/controller|src/controller/*)
        echo "$BASENAME" | grep -qE "^[A-Z][a-zA-Z]*Controller\.ts$" || \
            VIOLATION="Controllers must be named {Name}Controller.ts (PascalCase). Got: $BASENAME"
        ;;
    src/services|src/services/*)
        echo "$BASENAME" | grep -qE "^[A-Z][a-zA-Z]*Service\.ts$" || \
            VIOLATION="Services must be named {Name}Service.ts (PascalCase). Got: $BASENAME"
        ;;
    src/repositories|src/repositories/*)
        echo "$BASENAME" | grep -qE "^[A-Z][a-zA-Z]*Repository\.ts$" || \
            VIOLATION="Repositories must be named {Name}Repository.ts (PascalCase). Got: $BASENAME"
        ;;
    src/routes|src/routes/*)
        echo "$BASENAME" | grep -qE "^[a-z][a-zA-Z]*\.routes\.ts$" || \
            VIOLATION="Routes must be named {name}.routes.ts (camelCase). Got: $BASENAME"
        ;;
    src/dtos/response|src/dtos/response/*)
        echo "$BASENAME" | grep -qE "^[A-Z][a-zA-Z]*DTO\.ts$" || \
            VIOLATION="DTOs must be named {Name}DTO.ts (PascalCase). Got: $BASENAME"
        ;;
    src/constants|src/constants/*)
        echo "$BASENAME" | grep -qE "^[a-z][a-zA-Z]*\.ts$" || \
            VIOLATION="Constants must be named {name}.ts (camelCase). Got: $BASENAME"
        ;;
    src/validation|src/validation/*)
        echo "$BASENAME" | grep -qE "^[a-z][a-zA-Z]*Validation\.ts$" || \
            VIOLATION="Validation files must be named {name}Validation.ts (camelCase). Got: $BASENAME"
        ;;
esac

if [ -n "$VIOLATION" ]; then
    echo "BLOCKED: $VIOLATION" >&2
    exit 2
fi

exit 0
