# Pack minimal Web + Docker deploy folder: webtools-docker (for Baota upload).
# Usage (repo root):  powershell -ExecutionPolicy Bypass -File .\scripts\pack-docker-deploy.ps1
# Optional: -Zip  also creates webtools-docker.zip

param(
    [switch]$Zip
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'webtools-docker'

$excludeDirs = @('node_modules', 'dist', '.git')

function Copy-TreeExcluding {
    param([string]$Source, [string]$Dest)
    if (-not (Test-Path $Source)) { return }
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        if ($excludeDirs -contains $_.Name) { return }
        $target = Join-Path $Dest $_.Name
        if ($_.PSIsContainer) {
            Copy-TreeExcluding -Source $_.FullName -Dest $target
        } else {
            Copy-Item -LiteralPath $_.FullName -Destination $target -Force
        }
    }
}

if (Test-Path $Out) {
    Remove-Item -LiteralPath $Out -Recurse -Force
}
New-Item -ItemType Directory -Path $Out | Out-Null

Write-Host "Output: $Out"

foreach ($dir in @('src', 'public')) {
    Write-Host "Copy $dir\ ..."
    Copy-TreeExcluding -Source (Join-Path $Root $dir) -Dest (Join-Path $Out $dir)
}

Write-Host "Copy server\ (skip node_modules, dist)..."
Copy-TreeExcluding -Source (Join-Path $Root 'server') -Dest (Join-Path $Out 'server')

$rootFiles = @(
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.node.json',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'Dockerfile',
    'docker-compose.yml',
    'nginx.conf',
    'start.sh',
    '.dockerignore'
)

foreach ($f in $rootFiles) {
    $p = Join-Path $Root $f
    if (Test-Path -LiteralPath $p) {
        Copy-Item -LiteralPath $p -Destination (Join-Path $Out $f) -Force
        Write-Host "Copy $f"
    }
}

$envProd = Join-Path $Root '.env.production'
if (Test-Path -LiteralPath $envProd) {
    Copy-Item -LiteralPath $envProd -Destination (Join-Path $Out '.env.production') -Force
    Write-Host "Copy .env.production (do not commit secrets)"
}

Write-Host ""
Write-Host "Done. Upload folder webtools-docker to Baota, then run:"
Write-Host "  docker compose build"
Write-Host "  docker compose up -d"
Write-Host "Host 8080 maps to container 80 (see docker-compose.yml)"

if ($Zip) {
    $zipPath = Join-Path $Root 'webtools-docker.zip'
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    Compress-Archive -Path (Join-Path $Out '*') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host "Created: $zipPath"
}
