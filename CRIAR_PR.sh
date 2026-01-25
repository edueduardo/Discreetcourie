#!/bin/bash
echo "🚀 Abrindo GitHub para criar Pull Request..."
echo ""
xdg-open "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1" 2>/dev/null || \
open "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1" 2>/dev/null || \
start "https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1" 2>/dev/null || \
echo "🔗 Abra este link: https://github.com/edueduardo/Discreetcourie/compare/master...claude/solo-operator-system-11P1o?expand=1"
echo ""
echo "✅ Depois que a página abrir:"
echo "   1. Clique em 'Create pull request'"
echo "   2. Clique em 'Merge pull request'"
echo "   3. Clique em 'Confirm merge'"
echo "   4. PRONTO! Deploy em 30 segundos!"
