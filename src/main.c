#include <stdio.h>
#include <string.h>
#include "ast.h"

extern int yyparse(void);
extern No *raiz;
// isso tudo são só funções e arquivos que usamos em outros lugares

int main(int argc, char *argv[]) {
    int mostrar_arvore = 0;
    if (argc > 1) {
        if (strcmp("--ast", argv[1]) == 0){
            mostrar_arvore = 1;
        }
    } 
    int resultado = yyparse();

    if (resultado == 0) {
        fprintf(stderr, "Analise sintatica concluida sem erros.\n");
        if(mostrar_arvore == 1){
            imprimir_ast(raiz, 0);
        }
        // 0 é o nível onde começar a impressão a árvore e raiz é o ponteiro para o primeiro Nó feito.
    }
    liberar_ast(raiz);
    return resultado;
}