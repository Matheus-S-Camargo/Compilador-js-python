// Caso 12 (erro semantico): varios erros sao todos reportados
// Esperado: "Erro semantico na linha 7: variavel 'y' nao declarada"
// Esperado: "Erro semantico na linha 8: 'x' redeclarada no mesmo escopo (declarada antes na linha 6)"
// Esperado: "Erro semantico na linha 9: variavel 'z' nao declarada"
// Esperado: "3 erro(s) semantico(s) encontrado(s)."
let x = 1;
x = y + 1;
let x = 2;
z = x;
