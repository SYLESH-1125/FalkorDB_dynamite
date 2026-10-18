# Uploads the demo MP4 to GitHub assets and prints the bare URL for README inline playback.
# Prerequisite: gh auth login  (https://cli.github.com/)
$ErrorActionPreference = "Stop"
$repo = "SYLESH-1125/FalkorDB_dynamite"
$video = Join-Path $PSScriptRoot "..\docs\demo\project-selection-graph-solution-readme.mp4"
if (-not (Test-Path $video)) {
  $video = Join-Path $PSScriptRoot "..\docs\demo\project-selection-graph-solution.mp4"
}
if (-not (Test-Path $video)) { throw "Missing $video" }

$issue = gh issue create -R $repo --title "README demo video (asset host)" --body "Temporary issue to host the README MP4 via GitHub attachments." --json url,number
$num = ($issue | ConvertFrom-Json).number
$out = gh issue comment $num -R $repo --body "README inline video asset" --attach $video 2>&1 | Out-String
if ($out -match "(https://github\.com/user-attachments/assets/[a-f0-9-]+)") {
  $url = $Matches[1]
  $readme = Join-Path $PSScriptRoot "..\README.md"
  (Get-Content $readme -Raw) -replace "https://cdn\.jsdelivr\.net/gh/SYLESH-1125/FalkorDB_dynamite@main/docs/demo/project-selection-graph-solution-readme\.mp4", $url | Set-Content $readme -NoNewline
  Write-Host "Updated README.md with inline video URL:"
  Write-Host $url
  Write-Host "Commit and push README.md to FalkorDB_dynamite."
} else {
  Write-Host $out
  throw "Could not find user-attachments URL in gh output. Use GitHub web: edit README, drag the MP4 in."
}
