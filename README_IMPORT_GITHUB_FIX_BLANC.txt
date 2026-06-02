VERSION CORRIGEE ECRAN BLANC

Cause probable de l'ancien bug :
- Vite compilait avec des chemins absolus (/assets/...)
- Electron ouvrait dist/index.html en file://
- Résultat : écran blanc car JS/CSS introuvables.

Correction :
- vite.config.js avec base: './'
- Electron charge dist/index.html
- workflow vérifie que dist/index.html existe
- EXE générés :
  SECAB_Couplage_Expert_V5_PRO_Setup_FIX.exe
  SECAB_Couplage_Expert_V5_PRO_Portable_FIX.exe

Import GitHub :
La racine doit contenir :
.github
src
public
resources
main.js
package.json
vite.config.js
index.html
