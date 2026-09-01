const obj = { a: 1, b: undefined };
const clean = JSON.parse(JSON.stringify(obj));
console.log(clean);
