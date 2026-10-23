#include <stdio.h>
#include <string.h>
#include "ast.h"
#include "gerador.h"

extern int yyparse(void);
extern No *raiz;

int main(int argc, char *argv[]) {
    int resultado = yyparse();

    if (resultado == 0 && raiz != NULL) {
        int apenas_py = (argc > 1 && strcmp(argv[1], "--py") == 0);
        int apenas_ast = (argc > 1 && strcmp(argv[1], "--ast") == 0);

        if (apenas_py) {
            gerar_codigo(raiz, stdout);
        } else if (apenas_ast) {
            imprimir_ast(raiz, 0);
        } else {
            printf("Analise sintatica concluida sem erros.\n");
            imprimir_ast(raiz, 0);
        }
    }

    return resultado;
}