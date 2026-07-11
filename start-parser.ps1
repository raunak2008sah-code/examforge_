param (
    [switch]$Install = $false
)

Write-Host "Starting ExamForge Parser Service..." -ForegroundColor Cyan

Set-Location -Path "apps\parser"

if ($Install -or !(Test-Path "venv")) {
    Write-Host "Setting up Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
} else {
    .\venv\Scripts\Activate.ps1
}

Write-Host "Starting FastAPI on port 8000..." -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8000
