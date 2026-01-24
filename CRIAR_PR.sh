#!/bin/bash

# CLIQUE NESTE LINK PARA CRIAR PR E FAZER DEPLOY:
# https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1

echo "================================================"
echo "ABRA ESTE LINK NO BROWSER:"
echo ""
echo "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1"
echo ""
echo "Depois clique: Create pull request → Merge pull request"
echo "================================================"

# Abre o link automaticamente (se tiver xdg-open)
if command -v xdg-open > /dev/null; then
    xdg-open "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1"
elif command -v open > /dev/null; then
    open "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1"
fi
