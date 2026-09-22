#ifndef AST_H
#define AST_H

typedef struct No {
    char *tipo;
    char *valor;
    struct No **filhos;
    int contador_filhos;
    int linha;
} No;

No  *novo_ponteiro(const char *tipo, const char *valor, int linha);
void adicionar_filho(No *pai, No *filho);
void imprimir_ast(No *raiz, int nivel);
void liberar_ast(No *raiz);

#endif