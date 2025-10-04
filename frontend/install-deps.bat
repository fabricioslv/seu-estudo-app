@echo off
cd /d "%~dp0"
npm install --save-dev workbox-webpack-plugin terser cssnano madge
echo Dependências instaladas com sucesso!
pause