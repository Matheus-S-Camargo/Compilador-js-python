// Caso 11 (erro semantico): variavel do for usada depois do laco
// Esperado: "Erro semantico na linha 7: variavel 'i' nao declarada"
for (let i = 0; i < 3; i++) {
  console.log(i);
}

console.log(i);
