#!/bin/bash
# Uso: make && ./tests/rodar.sh
# Roda cada caso de tests/casos no compilador e confere o codigo de saida:
#   *_erro_*.js -> deve terminar com 2 (erro semantico)
#   demais      -> deve terminar com 0 (programa aceito)
cd "$(dirname "$0")/.."

COMPILADOR=./compilador
if [ ! -x "$COMPILADOR" ]; then
    echo "Compilador nao encontrado. Rode 'make' antes."
    exit 1
fi

ok=0
falha=0
for caso in tests/casos/*.js; do
    case "$caso" in
        *_erro_*) esperado=2 ;;
        *)        esperado=0 ;;
    esac

    mensagens=$("$COMPILADOR" < "$caso" 2>&1 >/dev/null)
    obtido=$?

    if [ "$obtido" -eq "$esperado" ]; then
        echo "OK     $caso (codigo $obtido)"
        ok=$((ok + 1))
    else
        echo "FALHA  $caso (esperado $esperado, obtido $obtido)"
        falha=$((falha + 1))
    fi
    [ -n "$mensagens" ] && echo "$mensagens" | sed 's/^/         /'
done

echo
echo "$ok OK, $falha FALHA"
[ "$falha" -eq 0 ]
