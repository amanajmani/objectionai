#!/bin/bash

# Script to reset an existing GitHub repository and replace with a new first commit

echo "🔄 Preparing to reset GitHub repository: https://github.com/amanajmani/objectionai"
echo "⚠️  WARNING: This will completely replace the existing repository history!"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Remove existing .git directory if it exists
if [ -d ".git" ]; then
  echo "Removing existing .git directory..."
  rm -rf .git
fi

# Initialize a new Git repository
echo "Initializing new Git repository..."
git init

# Add the remote repository
echo "Adding remote origin..."
git remote add origin https://github.com/amanajmani/objectionai.git

# Add all files
echo "Adding all files to Git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: ObjectionAI - AI-Powered IP Enforcement Platform"

# Force push to overwrite the existing repository
echo "Force pushing to GitHub to reset repository history..."
echo "This will replace ALL existing commits with this new initial commit."
git push -f origin main

echo ""
echo "✅ Repository has been reset with a new initial commit!"
echo ""
echo "Note: If you received an error about the branch name, try:"
echo "git push -f origin master"
echo ""
echo "After pushing, you may need to set the default branch in GitHub settings."