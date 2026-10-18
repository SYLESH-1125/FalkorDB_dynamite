# Uploads the demo MP4 to GitHub user-attachments and patches README for inline playback.
# Prerequisite: gh auth login
$ErrorActionPreference = "Stop"
$repo = "SYLESH-1125/FalkorDB_dynamite"
$video = Join-Path $PSScriptRoot "..\docs\demo\project-selection-graph-solution-readme.mp4"
if (-not (Test-Path $video)) {
  $video = Join-Path $PSScriptRoot "..\docs\demo\project-selection-graph-solution.mp4"
}
if (-not (Test-Path $video)) { throw "Missing demo MP4 under docs/demo/" }

$bodyFile = Join-Path $env:TEMP "bhumi-readme-video-body.md"
"README inline video asset host." | Set-Content $bodyFile -Encoding utf8

$out = gh issue create -R $repo --title "README demo video (asset host)" --body-file $bodyFile --attach $video 2>&1 | Out-String
$url = [regex]::Match($out, "https://github\.com/user-attachments/assets/[a-f0-9-]+").Value
if (-not $url) {
  $url = [regex]::Match($out, "https://github\.com/user-attachments/assets/\S+").Value
}
if (-not $url) {
  Write-Host $out
  throw "Could not find user-attachments URL. Edit README on GitHub and drag the MP4 in."
}

$readme = Join-Path $PSScriptRoot "..\README.md"
$cdn = "https://cdn.jsdelivr.net/gh/SYLESH-1125/FalkorDB_dynamite@main/docs/demo/project-selection-graph-solution-readme.mp4"
(Get-Content $readme -Raw) -replace $cdn, $url | Set-Content $readme -NoNewline
Write-Host "Updated README.md:"
Write-Host $url
Write-Host "Commit and push README.md to FalkorDB_dynamite."
