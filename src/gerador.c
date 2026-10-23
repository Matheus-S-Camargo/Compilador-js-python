#include <stdio.h>
#include <string.h>
#include "gerador.h"

static void gerar_codigo_nivel(const No *raiz, FILE *saida, int nivel);

static void emitir_indentacao(FILE *saida, int nivel) {
    for (int i = 0; i < nivel; i++) {
        fputs("    ", saida);
    }
}

static const char *converter_operador(const char *op) {
    if (!op) return "";
    if (strcmp(op, "&&") == 0) return "and";
    if (strcmp(op, "||") == 0) return "or";
    if (strcmp(op, "===") == 0) return "==";
    if (strcmp(op, "!==") == 0) return "!=";
    if (strcmp(op, "!") == 0) return "not ";
    return op;
}

static void emitir_corpo(const No *corpo, FILE *saida, int nivel) {
    if (corpo && (corpo->contador_filhos > 0 || strcmp(corpo->tipo, "bloco") != 0)) {
        gerar_codigo_nivel(corpo, saida, nivel + 1);
    } else {
        emitir_indentacao(saida, nivel + 1);
        fputs("pass\n", saida);
    }
}

static void gerar_expressao(const No *raiz, FILE *saida) {
    if (!raiz || !raiz->tipo) return;

    /* Booleanos e Nulo */
    if (strcmp(raiz->tipo, "bool") == 0 || strcmp(raiz->tipo, "TRUE") == 0 || strcmp(raiz->tipo, "FALSE") == 0) {
        if ((raiz->valor && (strcmp(raiz->valor, "false") == 0 || strcmp(raiz->valor, "FALSE") == 0)) ||
            strcmp(raiz->tipo, "FALSE") == 0) {
            fputs("False", saida);
        } else {
            fputs("True", saida);
        }
        return;
    }
    if (strcmp(raiz->tipo, "null") == 0 || strcmp(raiz->tipo, "VAZIO") == 0) {
        fputs("None", saida);
        return;
    }

    /* Ponto de Integracao (Israel/Bison): chamada de console.log ou funcoes gerais */
    if (strcmp(raiz->tipo, "chamada") == 0) {
        int eh_log = raiz->valor && (strcmp(raiz->valor, "console.log") == 0 || strcmp(raiz->valor, "log") == 0);
        fputs(eh_log ? "print(" : (raiz->valor ? raiz->valor : "func"), saida);
        if (!eh_log) fputs("(", saida);
        for (int i = 0; i < raiz->contador_filhos; i++) {
            if (i > 0) fputs(", ", saida);
            gerar_expressao(raiz->filhos[i], saida);
        }
        fputs(")", saida);
        return;
    }

    /* Ponto de Integracao (Israel/Bison): operacoes unarias (!, -, ++, --) */
    if (strcmp(raiz->tipo, "unop") == 0) {
        if (raiz->valor && strcmp(raiz->valor, "++") != 0 && strcmp(raiz->valor, "--") != 0) {
            fputs(converter_operador(raiz->valor), saida);
        }
        if (raiz->contador_filhos > 0) {
            gerar_expressao(raiz->filhos[0], saida);
        }
        return;
    }

    /* Ponto de Integracao (Israel/Bison): operacao binaria */
    if (raiz->contador_filhos >= 2 && strcmp(raiz->tipo, "atribuicao") != 0 && strcmp(raiz->tipo, "=") != 0) {
        gerar_expressao(raiz->filhos[0], saida);
        fprintf(saida, " %s ", converter_operador(raiz->valor ? raiz->valor : raiz->tipo));
        gerar_expressao(raiz->filhos[1], saida);
        return;
    }

    /* Folhas literais: identificador, numero, string */
    if (raiz->valor) {
        fputs(raiz->valor, saida);
    }
}

static void gerar_codigo_nivel(const No *raiz, FILE *saida, int nivel) {
    if (!raiz || !raiz->tipo) return;
    if (!saida) saida = stdout;

    /* Ponto de Integracao (Israel/Bison): sequencia de comandos ou bloco */
    if (strcmp(raiz->tipo, "programa") == 0 || strcmp(raiz->tipo, "bloco") == 0 || 
        strcmp(raiz->tipo, "lista_statements") == 0) {
        if (strcmp(raiz->tipo, "bloco") == 0 && raiz->contador_filhos == 0) {
            emitir_indentacao(saida, nivel);
            fputs("pass\n", saida);
            return;
        }
        for (int i = 0; i < raiz->contador_filhos; i++) {
            gerar_codigo_nivel(raiz->filhos[i], saida, nivel);
        }
        return;
    }

    /* Ponto de Integracao (Israel/Bison): declaracao e atribuicao (unificadas em Python) */
    if (strcmp(raiz->tipo, "decl_var") == 0 || strcmp(raiz->tipo, "let") == 0 || 
        strcmp(raiz->tipo, "const") == 0 || strcmp(raiz->tipo, "var") == 0 || 
        strcmp(raiz->tipo, "atribuicao") == 0 || strcmp(raiz->tipo, "=") == 0) {
        emitir_indentacao(saida, nivel);
        const char *op = (raiz->valor && strcmp(raiz->valor, "") != 0) ? raiz->valor : "=";
        if (raiz->contador_filhos >= 2) {
            gerar_expressao(raiz->filhos[0], saida);
            fprintf(saida, " %s ", op);
            gerar_expressao(raiz->filhos[1], saida);
        } else {
            fprintf(saida, "%s = ", raiz->valor ? raiz->valor : "x");
            if (raiz->contador_filhos == 1) gerar_expressao(raiz->filhos[0], saida);
            else fputs("None", saida);
        }
        fputs("\n", saida);
        return;
    }

    /* Ponto de Integracao (Israel/Bison): incremento e decremento como statement */
    if (strcmp(raiz->tipo, "unop") == 0) {
        emitir_indentacao(saida, nivel);
        if (raiz->contador_filhos > 0) {
            gerar_expressao(raiz->filhos[0], saida);
            if (raiz->valor && strcmp(raiz->valor, "++") == 0) {
                fputs(" += 1\n", saida);
            } else if (raiz->valor && strcmp(raiz->valor, "--") == 0) {
                fputs(" -= 1\n", saida);
            } else {
                fputs("\n", saida);
            }
        }
        return;
    }

    /* Ponto de Integracao (Israel/Bison): controle de fluxo if e while */
    if (strcmp(raiz->tipo, "if") == 0 || strcmp(raiz->tipo, "statement_if") == 0 ||
        strcmp(raiz->tipo, "while") == 0 || strcmp(raiz->tipo, "statement_while") == 0) {
        int eh_if = (raiz->tipo[0] == 'i');
        emitir_indentacao(saida, nivel);
        fprintf(saida, "%s ", eh_if ? "if" : "while");
        if (raiz->contador_filhos > 0) gerar_expressao(raiz->filhos[0], saida);
        else fputs("True", saida);
        fputs(":\n", saida);

        emitir_corpo(raiz->contador_filhos > 1 ? raiz->filhos[1] : NULL, saida, nivel);

        if (eh_if && raiz->contador_filhos > 2 && raiz->filhos[2]) {
            emitir_indentacao(saida, nivel);
            fputs("else:\n", saida);
            emitir_corpo(raiz->filhos[2], saida, nivel);
        }
        return;
    }

    /* Ponto de Integracao (Israel/Bison): for traduzido para while com incremento */
    if (strcmp(raiz->tipo, "for") == 0 && raiz->contador_filhos >= 4) {
        if (raiz->filhos[0]) {
            gerar_codigo_nivel(raiz->filhos[0], saida, nivel);
        }
        emitir_indentacao(saida, nivel);
        fputs("while ", saida);
        gerar_expressao(raiz->filhos[1], saida);
        fputs(":\n", saida);

        if (raiz->filhos[3]) gerar_codigo_nivel(raiz->filhos[3], saida, nivel + 1);
        if (raiz->filhos[2]) gerar_codigo_nivel(raiz->filhos[2], saida, nivel + 1);
        return;
    }

    /* Ponto de Integracao (Israel/Bison): chamada ou expressao solta como comando */
    emitir_indentacao(saida, nivel);
    gerar_expressao((raiz->contador_filhos > 0 && strcmp(raiz->tipo, "chamada") != 0) ? raiz->filhos[0] : raiz, saida);
    fputs("\n", saida);
}

void gerar_codigo(const No *raiz, FILE *saida) {
    gerar_codigo_nivel(raiz, saida, 0);
}
