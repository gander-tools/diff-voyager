# AI Assessment Prompts

This directory contains prompt configurations for the `github/ai-assessment-comment-labeler` action.

## How It Works

1. **Manual Trigger**: A maintainer adds the `needs-assessment` label to an issue
2. **AI Analysis**: GitHub Actions runs the AI assessment using prompts defined here
3. **Auto-Labeling**: The action adds appropriate labels based on AI analysis:
   - `ai:type:bug` - Issue is a bug report
   - `ai:type:feature` - Issue is a feature request
   - `ai:type:task` - Issue is a task
   - `ai:bug-review:ready for triage` - Issue is ready for team review
4. **Comment**: Optionally posts an AI-generated assessment comment

## Setup Required

### 1. Create the trigger label

Manually create a label in GitHub:
- Name: `needs-assessment`
- Description: "Trigger AI assessment of this issue"
- Color: `#D4C5F9` (purple)

### 2. Usage

When a new issue is created:
1. Review the issue briefly
2. Add the `needs-assessment` label
3. GitHub Actions will automatically analyze and label it
4. Review AI suggestions and adjust as needed

## Prompt Files

- `issue-triage.prompt.yml` - Main triage prompt for classifying issues

## Configuration

The workflow is configured in `.github/workflows/ai-assessment-comment-labeler.yml`.

## Requirements

- Repository must have `models: read` permission enabled
- GitHub Models API access (available for public repositories)
- Manual label creation (see above)
