// Caso 22 (erro semantico): return fora de funcao
// Esperado: "Erro semantico na linha 7: 'return' fora de funcao"
let x = 1;
if (x > 0) {
  console.log(x);
}
return x;
