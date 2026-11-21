@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

call :check_node
if not "%ERRORLEVEL%"=="0" exit /b 1

call :check_dependencies
if not "%ERRORLEVEL%"=="0" exit /b 1

echo.
echo ========================================
echo Testes Offline e Verificacao de Integridade
echo ========================================
echo.

echo Executando suite completa de testes automatizados...
%NODE_BIN% --test src/app.test.js src/gestao.test.js src/offline.test.js src/products.test.js src/faults.test.js src/frontend.test.js src/backend.test.js src/qualidade.test.js src/backend.test.js
if not "%ERRORLEVEL%"=="0" (
  echo.
  echo [ERRO] Falha nos testes automatizados.
  exit /b 1
)

echo.
echo Testes automatizados concluidos com sucesso.
echo.
echo Verificando sintaxe de todos os scripts do frontend...

set FRONTEND_FILES=public\config.js public\products.js public\auth.js public\app.js public\gestao.js public\admin.js public\operacional.js public\cliente.js public\login.js

for %%F in (%FRONTEND_FILES%) do (
  if exist "%%F" (
    %NODE_BIN% --check "%%F"
    if not "!ERRORLEVEL!"=="0" (
      echo.
      echo [ERRO] Falha na sintaxe do arquivo: %%F
      exit /b 1
    )
    echo  [OK] Sintaxe valida: %%F
  ) else (
    echo  [ERRO] Arquivo essencial nao encontrado: %%F
    exit /b 1
  )
)

echo.
echo Verificando arquivos estaticos e paginas da aplicacao...

set REQUIRED_FILES=public\index.html public\login.html public\cliente.html public\admin.html public\operacional.html public\style.css public\images\raizes-logo.svg

for %%F in (%REQUIRED_FILES%) do (
  if not exist "%%F" (
    echo  [ERRO] Arquivo estatico nao encontrado: %%F
    exit /b 1
  )
  echo  [OK] Presente no disco: %%F
)

echo.
echo ========================================
echo Todos os testes e verificacoes passaram!
echo O prototipo esta 100%% preparado para uso offline.
echo ========================================
echo.

if "%1"=="--no-server" goto :done
if "%1"=="--ci" goto :done
if "%1"=="/noserver" goto :done

echo Iniciando o servidor para testes manuais no navegador...
call "iniciar-servidor.bat"
exit /b %ERRORLEVEL%

:done
echo Verificacao offline finalizada com exito.
exit /b 0

:check_node
where node >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  set "NODE_BIN=node"
  echo Node.js encontrado no sistema.
  exit /b 0
)
if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
  set "NODE_BIN=node"
  echo Node.js encontrado em %ProgramFiles%\nodejs.
  exit /b 0
)
for /d %%D in ("%LOCALAPPDATA%\Programs\*") do (
  if exist "%%~fD\resources\app" (
    for %%E in ("%%~fD\*.exe") do (
      if /i not "%%~nxE"=="unins000.exe" (
        set "ELECTRON_RUN_AS_NODE=1"
        set "NODE_BIN="%%~fE""
        echo Runtime Node.js local encontrado.
        exit /b 0
      )
    )
  )
)

echo [ERRO] Node.js nao encontrado no PATH.
exit /b 1

:check_dependencies
if not exist "node_modules" (
  echo [ERRO] Pasta node_modules nao encontrada. Execute: npm install
  exit /b 1
)

echo Dependencias locais encontradas em node_modules.
exit /b 0
