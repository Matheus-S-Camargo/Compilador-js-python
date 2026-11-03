# Validação da integração

## Resultado geral

- Projeto compilado com todos os módulos integrados.
- Opções `--ast` e `--py` verificadas no caso 01.
- Separação entre saída normal e mensagens de erro verificada em casos válidos e inválidos.
- As 17 verificações de `tests/rodar.sh` passaram após a correção.
- Os cinco exemplos válidos foram executados em JavaScript e no Python gerado, com saídas iguais.

## Casos organizados

| Casos | Finalidade | Resultado |
|---|---|---|
| 01 | Variáveis e contas | Saídas iguais |
| 02 | Condições | Saídas iguais |
| 03 | Repetição com `while` | Saídas iguais |
| 06 | Variáveis dentro de blocos | Saídas iguais |
| 07 | Funções e repetições | Saídas iguais após correção |
| 04, 05 e 08 a 14 | Verificar erros no uso de nomes e declarações | Verificações existentes passaram |
| 15 a 17 | Verificar instruções malformadas | Verificações existentes passaram |

## Correção realizada

O caso 07 revelou que o Python chamava uma função antes de sua definição, causando `NameError`.

O gerador foi ajustado para escrever primeiro as definições das funções e depois as demais instruções de cada lista. Após a mudança, o caso produziu `0`, `1`, `2` e `7`, como o JavaScript original.

Todas as verificações existentes e as comparações dos cinco exemplos válidos foram repetidas com sucesso.

## Observações e limites

- Permanecem dois avisos de funções não utilizadas no arquivo gerado pelo Flex.
- Os resultados se referem aos exemplos existentes; não comprovam suporte a todas as possibilidades do JavaScript.
- O caso 02 não cobre todos os caminhos alternativos das condições.

## Continuidade na Sprint 9

Os casos estão separados entre programas válidos, erros semânticos e erros sintáticos. A comparação automática da execução de JavaScript e Python poderá complementar as verificações já presentes em `tests/rodar.sh`.