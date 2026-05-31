#!/bin/bash
git add .
git commit -m "style: optimize for mobile responsiveness and add Delete All feature in Settings"
git push origin HEAD
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main
    git pull origin main
    git merge $CURRENT_BRANCH -m "Merge $CURRENT_BRANCH into main"
    git push origin main
    git checkout $CURRENT_BRANCH
fi
