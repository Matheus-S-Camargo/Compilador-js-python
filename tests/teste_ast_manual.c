#include <stdio.h>
#include "ast.h"


int main(){
    No *programa = novo_ponteiro("programa", NULL, 1);
    No *decl_var = novo_ponteiro("decl_var", "x", 1);
    No *num = novo_ponteiro("numero", "10", 1);
    No *num2 = novo_ponteiro("numero", "20", 1);
    No *operacao = novo_ponteiro("operacao", "+", 1);
    // novo_ponteiro recebe um char, um valor(também é uma string) e a linha do código
    adicionar_filho(programa, decl_var);
    adicionar_filho(decl_var, operacao);
    adicionar_filho(operacao, num);
    adicionar_filho(operacao, num2);
    imprimir_ast(programa, 0);
    liberar_ast(programa);
    return 0;
}