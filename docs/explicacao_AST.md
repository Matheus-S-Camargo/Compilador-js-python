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


