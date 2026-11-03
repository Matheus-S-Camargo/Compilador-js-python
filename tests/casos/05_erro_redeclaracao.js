// Caso 05 (erro semantico): redeclaracao no mesmo escopo
// Esperado: "Erro semantico na linha 6: 'contador' redeclarada no mesmo escopo (declarada antes na linha 3)"
let contador = 0;
contador = contador + 1;

let contador = 5;
