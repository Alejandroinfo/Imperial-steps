#!/bin/sh
# Uso, desde la raíz de tu copia del repositorio (con lo anterior ya aplicado):
#   git pull
#   unzip -o ruta/cambios_telefono_28-10-2026.zip
#   sh aplicar_cambios.sh
#   git push
set -e
rm -f aplicar_cambios.sh
npm test && npm run check
git add -A
git commit -m "Phone layout: bottom sheet, nav bar, floating Ready button, pinch zoom, tap tooltips"
echo "Listo. Falta solo: git push"
