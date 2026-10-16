@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

call :check_node
if not "%ERRORLEVEL%"=="0" exit /b 1

call :check_dependencies
if not "%ERRORLEVEL%"=="0" exit /b 1

echo.
echo ================================
echo Testes offline do prototipo
echo ================================
echo.

node --test src/app.test.js
if not "%ERRORLEVEL%"=="0" (
  echo.
  echo Falha nos testes de API.
  exit /b 1
)

echo.
echo Testes de API concluídos com sucesso.
echo.
echo Verificando sintaxe da interface...

"%ProgramFiles%\nodejs\node.exe" --check public/app.js
if not "%ERRORLEVEL%"=="0" (
  echo.
  echo Falha na sintaxe do front-end.
  exit /b 1
)

echo.
echo Verificando arquivos estaticos...
if not exist "public\index.html" (
  echo Arquivo public\index.html nao encontrado.
  exit /b 1
)

if not exist "public\style.css" (
  echo Arquivo public\style.css nao encontrado.
  exit /b 1
)

echo.
echo Tudo pronto para uso offline.
echo.

echo.
echo Iniciando o servidor para testes manuais...
call "iniciar-servidor.bat"
exit /b %ERRORLEVEL%

:check_node
where node >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo Node.js encontrado.
  exit /b 0
)

echo Node.js nao encontrado no PATH.
exit /b 1

:check_dependencies
if not exist "node_modules" (
  echo node_modules nao encontrado. Execute: npm install
  exit /b 1
)

echo Dependencias encontradas.
exit /b 0
