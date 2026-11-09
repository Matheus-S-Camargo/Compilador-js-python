// Caso 21 (erro semantico): lado esquerdo de atribuicao ou ++/-- nao atribuivel
// Esperado: "Erro semantico na linha 9: lado esquerdo de '=' nao e atribuivel"
// Esperado: "Erro semantico na linha 10: lado esquerdo de '+=' nao e atribuivel"
// Esperado: "Erro semantico na linha 11: lado esquerdo de '=' nao e atribuivel"
// Esperado: "Erro semantico na linha 12: operando de '++' nao e atribuivel"
// Esperado: "4 erro(s) semantico(s) encontrado(s)."
let a = 1;
function f() { return 1; }
1 = 2;
a + 1 += 3;
f() = a;
5++;
