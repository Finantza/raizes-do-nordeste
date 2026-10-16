@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 20 ou superior e tente novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm nao encontrado. Reinstale o Node.js com npm incluido e tente novamente.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias do projeto...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando o servidor Raizes do Nordeste...
start "Raizes do Nordeste - servidor" cmd /k "cd /d ""%~dp0"" && npm start"

echo Aguardando o servidor em http://localhost:3000 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$limite = (Get-Date).AddSeconds(30); do { try { $resposta = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 2; if ($resposta.StatusCode -eq 200) { exit 0 } } catch { Start-Sleep -Milliseconds 500 } } while ((Get-Date) -lt $limite); exit 1"
if errorlevel 1 (
  echo O servidor nao respondeu. Confira a janela do servidor e se a porta 3000 esta livre.
  pause
  exit /b 1
)

echo Abrindo a aplicacao no navegador...
start "" "http://localhost:3000/"
echo.
echo Mantenha aberta a janela do servidor enquanto testa.
exit /b 0
