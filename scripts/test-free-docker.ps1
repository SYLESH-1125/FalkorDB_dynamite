# Smoke-test Dockerfile.free when Docker Desktop is running.
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$backend = Join-Path $root "FalkorDB_dynamite\backend"
if (-not (Test-Path $backend)) { $backend = Join-Path $PSScriptRoot "..\backend" }
Set-Location $backend

docker info | Out-Null
docker build -f Dockerfile.free -t bhumi-free-test .
docker run --rm `
  -e PORT=8000 `
  -e JWT_SECRET=local-test-secret-32-characters-min `
  -e DATABASE_URL="postgresql+asyncpg://bhumi:bhumi_dev_pw@host.docker.internal:55432/bhumi" `
  -e DATABASE_SSL=false `
  -p 8000:8000 `
  bhumi-free-test
