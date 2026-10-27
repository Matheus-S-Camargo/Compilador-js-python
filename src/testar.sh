#!/bin/bash
# Uso: ./testar.sh   (rode dentro da pasta com grammar.y, lexico.l, ast.c, ast.h e main.c)
set -e
cd "$(dirname "$0")"

echo "== 1. Gerando parser e lexer =="
bison -d grammar.y          # gera grammar.tab.c e grammar.tab.h (avisos de conflito aparecem aqui)
flex lexico.l               # gera lex.yy.c (precisa do grammar.tab.h, por isso vem depois)

echo "== 2. Compilando =="
gcc -g grammar.tab.c lex.yy.c ast.c main.c -o compilador

echo
echo "== 3. Teste da issue: let x = 2; =="
echo 'let x = 2;' | ./compilador

echo
echo "== 4. Programa vazio =="
printf '' | ./compilador

echo
echo "== 5. Erro sintatico (precisa falhar) =="
echo 'let x = ;' | ./compilador || echo "(falhou como esperado, codigo $?)"
