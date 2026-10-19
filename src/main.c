#include <stdio.h>
#include "ast.h"

extern int yyparse(void);
extern No *raiz;

int main(void) {
    int resultado = yyparse();

    if (resultado == 0) {
        printf("Analise sintatica concluida sem erros.\n");
        imprimir_ast(raiz, 0);
    }

    return resultado;
}