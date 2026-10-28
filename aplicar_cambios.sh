#!/bin/sh
# Uso, desde la raíz de tu copia del repositorio (con lo anterior ya aplicado):
#   unzip -o cambios_ingles_28-10-2026.zip ; sh aplicar_cambios.sh ; git push
set -e
rm -f aplicar_cambios.sh
npm test && npm run check
git add -A
git commit -m "Optional English: UI translator, dictionary and Menu selector"
echo "Listo. Falta solo: git push"
