# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Chrome extension upload"

# You'll need to create a new repository on GitHub first
Write-Host "Please create a new repository on GitHub and enter the repository URL:"
$repoUrl = Read-Host

# Add the remote repository
git remote add origin $repoUrl

# Push to GitHub
git push -u origin master

Write-Host "Extension successfully uploaded to GitHub!"
