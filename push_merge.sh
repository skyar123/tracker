#!/bin/bash
git add .
git commit -m "feat: Add 6-Month and Termination Focused Checklists, improve Magic Import parsing for caseload format and exclude SSNs, and implement Fast-Forward Catch-Up mode"
git push origin HEAD
# Ensure we are on a branch, then merge to main. 
# Wait, if we're already on main, git checkout main will just say already on main.
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main
    git pull origin main
    git merge $CURRENT_BRANCH -m "Merge $CURRENT_BRANCH into main"
    git push origin main
    git checkout $CURRENT_BRANCH
fi
