# Explicação do código ast.h linha a linha

A intenção desse arquivo é para puro aprendizado e situar quem quiser fazer a leitura desse arquivo e consiga avaliar possíveis erros futuros.

## "No *novo_ponteiro(const char *tipo, const char *valor, int linha) {"

Essa função devolve um ponteiro, um endereço de memória, os tipos são também ponteiros que vão receber do bison. Queremos criar o espaço e prepará-lo basicamente.

## No *tamanho = malloc(sizeof(No));

Calcula quantos bytes o "No" ocupa, calculando automaticamente para a gente o tamanho necessário e guarda em uma variável local "tamanho", faz a "caixa", mas vazia. Se ele tiver vários filhos ou nenhum, não muda o espaço alocado, mudará só depois quando formos adicionar filhos usando realloc

## tamanho->tipo = strdup(tipo);

Essa seta é para acessar algo dentro de struct quando tem o endereço. o strdup(tipo) significa criar uma duplicada da string para um espaço novo e devolve o endereço dessa cópia. Fazemos uma cópia, pois pode ser que o valor que recebemos seja temporário, o original pode ser reaproveitado ou poderia sumir e apontaríamos para um lugar que não tem mais o que queremos. Queremos garantir seu lugar em uma caixa que não irá mudar.

##  tamanho->valor = valor ? strdup(valor) : NULL; (está escrito sem o ternário)

Caso seja nulo, será atribuído o nulo, caso não fizessemos isso, o strdup bugaria o programa.

##  tamanho->filhos = NULL; tamanho->contador_filhos = 0;

Ainda não existe array para apontar e um contador que será usado depois.

## tamanho->linha = linha;

Copia o número que a função recebeu pro campo do struct e como o int não é um ponteiro, copiamos só o valor mesmo.

## return tamanho; }

Devolve o ponteiro (endereço) do nó que foi montada para usar.

## Quem chama essa função?

O grammar.y (bison) - toda vez que o Bison reconhece uma regra, ele chama um novo_ponteiro para criar o que representa aquele pedaço. Cada chamada cria um nó pequeno. 

## Exemplo prático

Bison reconhece o token NUMERO (10) -> chama novo_ponteiro("num","10",linha) -> cria A;
                  token NUMERO (5) -> chama novo_ponteiro("num","5",linha) -> cria B;
            
Reconhece a regra "expressao ADICAO expressao" -> chama novo_ponteiro("binop", "+",linha) -> cria C;
Depois, chamará uma função nova que é a de adicionar_filho chamando A,C e C,B;
No final, C representará 10 + 5.

## void add_filho(No *pai, No *filho){

Função que serve para juntar dois ponteiros que já passaram pela função passada.

## pai->contador_filhos++;

Só aumentar o contador para calcular o tamanho do array, será o índice do filho

## pai->filhos = realloc(pai->filhos, pai->contador_filhos * sizeof(No *));

Realocar para um novo tamanho, pega o endereço dele e aumenta o número de bytes que o array precisa ter no total, número de filhos x tamanho do ponteiro.

## pai -> filhos[pai->contador_filhos - 1] = filho;

Só adicionando o filho no índice certo.

## void imprimir_ast(No *raiz, int nivel) {
A raiz é a árvore inteira que irá ficar se chamando e passando os filhos, o nó que está imprimindo agora. o Nível é para dizer quantos níveis de profundidade esse nó está, quanto espaços de indentação usar.

## if (raiz == NULL) {

Para a recursão ter um fim, é a condição de parada.

## for (int i = 0; i < nivel; i++) {

Para identar, para a árvore ficar visualmente "escalonada"

## printf("%s: %s (linha %d)\n", raiz->tipo, raiz->valor ? raiz->valor : "", raiz->linha);

O ternário serve para não mandar string com NULL e dar erro. 

## for (int i = 0; i < raiz->contador_filhos; i++) {
## imprimir_ast(raiz->filhos[i], nivel + 1);

Depois de imprimir o nó atual, a função percorre cada filho dele e chama cada um por nível. Vai se imprimindo até cair no NULL.

## void liberar_ast(No *raiz) {

Precisamos do endereço da raiz para liberá-la.

## if (raiz == NULL) {

Condição de parada.

## for (int i = 0; i < raiz->contador_filhos; i++) {

A ordem importa e é o contrário do intuitivo, precisamos liberar os filhos antes de mexer no nó em si. 

## free(raiz-> filhos);

Liberado todos os filhos, liberamos o array em si.

##  free(raiz->tipo);
##  free(raiz->valor);

Libera as duas cópias criadas pelo strdup.

## free(raiz);

Libera a caixa principal.

# Bônus dessa sprint

Irei modificar onde o main é executado para melhor organização e evitar bugs

##  #include "ast.h"

Dizendo com "" é que está na pasta do projeto, não nas bibliotecas.

## extern int yyparse(void);

yyparse é a função que o Bison gera automaticamente dentro do grammar.tab.c (ela é o "motor" que efetivamente lê os tokens e aplica as regras de gramática). Precisa saber que ela existe em outro lugar e qual é a "cara" dela (recebe nada, devolve um int).

## extern No *raiz;

Guarda o endereço do nó raiz da árvore, depois que a gramática for atualizada pra construir a AST de verdade.

## Observação importante

Quando, depois, alguém escrever a ação da regra programa pra montar a árvore, essa pessoa só vai precisar fazer raiz = $$; ali — a variável já vai existir, só falta preencher.