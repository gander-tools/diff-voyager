#!/usr/bin/env bash

cd "$CLAUDE_PROJECT_DIR" || { echo "Error: CLAUDE_PROJECT_DIR variable is not set or is empty"; exit 1; }

if test -x "$(command -v bunx)"; then
  bunx -y @biomejs/biome check --write .
elif test -x "$(command -v npx)"; then
  npx -y @biomejs/biome check --write .
else
  echo "Error: Failed to execute npx -y @biomejs/biome check --write ."
fi
