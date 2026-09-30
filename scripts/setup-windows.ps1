param(
    [string]$DemoPassword = "Kineva-Demo-2026!",
    [switch]$SkipModelDependencies
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

if (-not (Test-Path $venvPython)) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        & $python.Source -m venv (Join-Path $projectRoot ".venv")
    } else {
        $launcher = Get-Command py -ErrorAction SilentlyContinue
        if (-not $launcher) {
            throw "Instala Python 3.12 y vuelve a ejecutar este script."
        }
        & $launcher.Source -3.12 -m venv (Join-Path $projectRoot ".venv")
    }
}

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $backendPath "requirements-lock.txt")

if (-not $SkipModelDependencies) {
    & $venvPython -m pip install torch==2.14.0 torchvision==0.29.0 --index-url https://download.pytorch.org/whl/cpu
    & $venvPython -m pip install -r (Join-Path $backendPath "requirements-ml.txt")
}

$envPath = Join-Path $backendPath ".env"
if (-not (Test-Path $envPath)) {
    $secretBytes = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48)
    $secret = [Convert]::ToBase64String($secretBytes)
    $settings = @"
DATABASE_URL=sqlite:///preview.db
APP_ENV=demo
SECRET_KEY=$secret
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173,http://[::1]:5173
STORAGE_PATH=storage
RETENTION_DAYS=30
SESSION_MINUTES=60
INFERENCE_MODE=demo
SEGMENTATION_ENABLED=true
SEGMENTATION_MODEL_PATH=model_artifacts/best.pt
SEGMENTATION_THREADS=2
DEMO_PASSWORD=$DemoPassword
REGISTRATION_CLINICIAN_EMAIL=salud@demo.local
PRIVACY_CONTROLLER=Pendiente de configuracion y revision
PRIVACY_ADDRESS=Pendiente de configuracion y revision
PRIVACY_CONTACT=Pendiente de configuracion y revision
"@
    [System.IO.File]::WriteAllText($envPath, $settings, [System.Text.UTF8Encoding]::new($false))
}

Push-Location $backendPath
try {
    & $venvPython -m alembic upgrade head
    & $venvPython -m app.seed
} finally {
    Pop-Location
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw "Instala Node.js 22 o posterior y vuelve a ejecutar este script."
}
Push-Location $frontendPath
try {
    npm.cmd ci
} finally {
    Pop-Location
}

Write-Host "Configuracion terminada."
Write-Host "Backend:  cd backend; & ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-access-log"
Write-Host "Frontend: cd frontend; npm.cmd run dev -- --host 127.0.0.1 --port 5173"
Write-Host "Clave demo configurada: $DemoPassword"
