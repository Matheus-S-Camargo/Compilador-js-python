#!/bin/bash
# Uso: make && ./tests/rodar.sh
# Roda cada caso de tests/casos no compilador e confere:
# codigo 2 (erro semantico)
# codigo 0 (programa aceito) 
cd "$(dirname "$0")/.."

COMPILADOR=./compilador
if [ ! -x "$COMPILADOR" ]; then
    echo "Compilador nao encontrado. Rode 'make' antes."
    exit 1
fi

saida=$(mktemp)
mensagens=$(mktemp)
trap 'rm -f "$saida" "$mensagens"' EXIT

ok=0
falha=0
for caso in tests/casos/*.js; do
    case "$caso" in
        *_erro_*) esperado=2 ;;
        *)        esperado=0 ;;
    esac

    "$COMPILADOR" < "$caso" > "$saida" 2> "$mensagens"
    obtido=$?

    problemas=""
    [ "$obtido" -ne "$esperado" ] && problemas+="esperado codigo $esperado, obtido $obtido; "
    if [ "$esperado" -eq 2 ]; then
        [ -s "$saida" ] && problemas+="gerou codigo Python mesmo com erro; "
        while IFS= read -r msg; do
            grep -qF "$msg" "$mensagens" || problemas+="faltou mensagem: $msg; "
        done < <(sed -n 's/^\/\/ Esperado: "\(.*\)"\r\?$/\1/p' "$caso")
    else
        [ -s "$mensagens" ] && problemas+="stderr nao vazio; "
    fi

    if [ -z "$problemas" ]; then
        echo "OK     $caso (codigo $obtido)"
        ok=$((ok + 1))
    else
        echo "FALHA  $caso (${problemas%; })"
        falha=$((falha + 1))
    fi
    [ -s "$mensagens" ] && sed 's/^/         /' "$mensagens"
done

echo
echo "$ok OK, $falha FALHA"
[ "$falha" -eq 0 ]
