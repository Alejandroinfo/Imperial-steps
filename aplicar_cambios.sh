#!/bin/sh
# Uso, desde la carpeta de tu copia del repositorio:
#   git pull
#   unzip -o ruta/cambios_28-10-2026.zip
#   sh aplicar_cambios.sh
#   git push
set -e
git rm -q --ignore-unmatch pruebas.yml
git rm -q --ignore-unmatch docs/TRASPASO_sesion_2026-10-26.md docs/TRASPASO_sesion_2026-10-27.md docs/balance_economia.md
rm -f aplicar_cambios.sh
npm test && npm run check
git add -A
git commit -m "Bots bid expected value, save up for auctions and propose trades; 10-step auction notice, variable cargo, year-long flood, yearly tribe growth, downloadable game log, tech spreadsheet synced, dead code removed"
echo "Listo. Falta solo: git push"
