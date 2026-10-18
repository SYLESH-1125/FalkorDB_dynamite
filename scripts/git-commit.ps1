# Commits without Cursor prepare-commit-msg hooks / co-author trailers.
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message
)
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
git -c core.hooksPath=NUL commit -m $Message
