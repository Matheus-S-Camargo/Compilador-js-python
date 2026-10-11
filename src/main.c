#include <stdio.h>
#include "ast.h"

extern int yyparse(void);
extern No *raiz;
// isso tudo são só funções e arquivos que usamos em outros lugares

int main(void) {
    int resultado = yyparse();

    if (resultado == 0) {
        printf("Analise sintatica concluida sem erros.\n");
        imprimir_ast(raiz, 0);
        // 0 é o nível onde começar a impressão a árvore e raiz é o ponteiro para o primeiro Nó feito.
    }
    liberar_ast(raiz);
    return resultado;
}