
const data = [0xC0, 0x01];
const b1 = data[1];
const b2 = data[2];

const filtered = [b1, b2].filter((b): b is number => b !== undefined);

console.log('Original data:', data);
console.log('b1:', b1);
console.log('b2:', b2);
console.log('Filtered:', filtered);

filtered.map(b => console.log('Byte:', b.toString(16)));
