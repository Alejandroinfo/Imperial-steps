#!/bin/sh
# Uso, desde la raíz de tu copia del repositorio (con lo anterior ya aplicado):
#   git pull
#   unzip -o ruta/cambios_interfaz2_28-10-2026.zip
#   sh aplicar_cambios.sh
#   git push
set -e
rm -f aplicar_cambios.sh
npm test && npm run check
git add -A
git commit -m "Map header removed, usable network plan, icon tabs, compact panels, single Victory chart, tribe requests in Empire, specialists work in buildings, undo"
echo "Listo. Falta solo: git push"
