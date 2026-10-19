#include <stdio.h>
#include "../src/ast.h"
#include "../src/gerador.h"

int main(void) {
    No *no_numero = novo_ponteiro("num", "100", 1);
    No *no_id = novo_ponteiro("id", "total", 1);

    printf("Saida numero: ");
    gerar_codigo(no_numero, stdout);
    printf("\n");

    printf("Saida identificador: ");
    gerar_codigo(no_id, stdout);
    printf("\n");

    liberar_ast(no_numero);
    liberar_ast(no_id);

    return 0;
}
