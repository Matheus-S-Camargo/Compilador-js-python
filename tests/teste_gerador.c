#include <stdio.h>
#include <stdlib.h>
#include "../src/ast.h"
#include "../src/gerador.h"

static No *binop(const char *op, No *esq, No *dir) {
    No *no = novo_ponteiro("binop", op, 1);
    adicionar_filho(no, esq);
    adicionar_filho(no, dir);
    return no;
}

static No *decl(const char *var, No *expr) {
    No *no = novo_ponteiro("decl_var", var, 1);
    if (expr) adicionar_filho(no, expr);
    return no;
}

static No *chamada_log(No *arg1, No *arg2) {
    No *no = novo_ponteiro("chamada", "console.log", 1);
    if (arg1) adicionar_filho(no, arg1);
    if (arg2) adicionar_filho(no, arg2);
    return no;
}

int main(void) {
    /*
     * Programa JS modelado na AST:
     * let total = 0;
     * while (total < 3) {
     *     console.log("Contador:", total);
     *     total = total + 1;
     * }
     * if (total == 3) {
     *     console.log("Sucesso!");
     * } else {
     *     console.log("Erro!");
     * }
     */

    No *prog = novo_ponteiro("programa", NULL, 1);

    /* total = 0 */
    adicionar_filho(prog, decl("total", novo_ponteiro("num", "0", 1)));

    /* while total < 3 */
    No *no_while = novo_ponteiro("while", NULL, 2);
    adicionar_filho(no_while, binop("<", novo_ponteiro("id", "total", 2), novo_ponteiro("num", "3", 2)));

    No *bloco_while = novo_ponteiro("bloco", NULL, 3);
    adicionar_filho(bloco_while, chamada_log(novo_ponteiro("str", "\"Contador:\"", 3), novo_ponteiro("id", "total", 3)));

    No *atrib = novo_ponteiro("atribuicao", "total", 4);
    adicionar_filho(atrib, binop("+", novo_ponteiro("id", "total", 4), novo_ponteiro("num", "1", 4)));
    adicionar_filho(bloco_while, atrib);
    adicionar_filho(no_while, bloco_while);
    adicionar_filho(prog, no_while);

    /* if total == 3 */
    No *no_if = novo_ponteiro("if", NULL, 5);
    adicionar_filho(no_if, binop("==", novo_ponteiro("id", "total", 5), novo_ponteiro("num", "3", 5)));

    No *bloco_then = novo_ponteiro("bloco", NULL, 6);
    adicionar_filho(bloco_then, chamada_log(novo_ponteiro("str", "\"Sucesso!\"", 6), NULL));
    adicionar_filho(no_if, bloco_then);

    No *bloco_else = novo_ponteiro("bloco", NULL, 7);
    adicionar_filho(bloco_else, chamada_log(novo_ponteiro("str", "\"Erro!\"", 7), NULL));
    adicionar_filho(no_if, bloco_else);
    adicionar_filho(prog, no_if);

    /* 1. Emite codigo gerado */
    printf("=== Codigo Python Gerado ===\n");
    gerar_codigo(prog, stdout);
    printf("============================\n");

    /* 2. Grava e valida automaticamente com Python */
    FILE *f = fopen("tests/saida_teste.py", "w");
    if (f) {
        gerar_codigo(prog, f);
        fclose(f);
    }

    printf("\nExecutando validacao automatica no interpretador Python:\n");
    int status = system("python tests/saida_teste.py");
    printf("\nStatus da execucao Python: %s\n", status == 0 ? "SUCESSO (codigo 0)" : "FALHA");

    liberar_ast(prog);
    return status;
}
