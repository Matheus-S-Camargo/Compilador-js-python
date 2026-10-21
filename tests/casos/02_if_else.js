// Caso 02: if/else com comparacoes e operadores logicos
let idade = 20;
let ativo = true;
let categoria = 0;

if (idade >= 18 && ativo) {
  categoria = 1;
} else {
  categoria = 2;
}

if (idade < 10 || !ativo) {
  console.log("crianca ou inativo");
} else {
  console.log("adulto ativo");
}

console.log(categoria);
