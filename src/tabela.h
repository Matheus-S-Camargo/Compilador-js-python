#ifndef TABELA_H
#define TABELA_H

typedef struct Simbolo {
    char *nome;
    char *categoria;   /* "variavel" ou "funcao" */
    char *tipo;        /* "num", "str", "bool", "null", "desconhecido" */
    int   constante;   /* 1 se declarado com const */
    int   n_params;    /* só para funcao */
    int   linha;
    struct Simbolo *prox;
} Simbolo;

void     abrir_escopo(void);
void     fechar_escopo(void);
void     inserir(const char *nome, const char *categoria, const char *tipo, int constante, int linha);
Simbolo *buscar(const char *nome);             /* procura em todos os escopos abertos */
Simbolo *buscar_escopo_atual(const char *nome);
void     imprimir_tabela(void);

#endif
