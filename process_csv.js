const fs = require('fs');

// Ler CSV com encoding correto
const csvPath = 'C:\\Users\\luiz_\\Downloads\\Lista Municípios - municipios.csv';
const data = fs.readFileSync(csvPath, 'utf-8');

// Processar linhas
const lines = data.split('\n').slice(1); // Pular cabeçalho
const byUF = {};

lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const parts = trimmed.split(',');
    if (parts.length >= 2) {
        const municipio = parts[0].trim();
        const uf = parts[1].trim();
        
        if (uf && municipio) {
            if (!byUF[uf]) {
                byUF[uf] = [];
            }
            byUF[uf].push(municipio);
        }
    }
});

// Ordenar UFs
const ufsOrdenadas = Object.keys(byUF).sort();

// Gerar arquivo TypeScript
let tsContent = '// Dados de municípios brasileiros por UF\n';
tsContent += '// Gerado automaticamente a partir do CSV\n\n';

tsContent += 'export const municipiosPorUF: Record<string, string[]> = {\n';

ufsOrdenadas.forEach((uf, index) => {
    const municipios = byUF[uf];
    tsContent += `  "${uf}": [\n`;
    municipios.forEach((mun, idx) => {
        const escapedMun = mun.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        tsContent += `    "${escapedMun}"${idx < municipios.length - 1 ? ',' : ''}\n`;
    });
    tsContent += `  ]${index < ufsOrdenadas.length - 1 ? ',' : ''}\n`;
});

tsContent += '};\n\n';

tsContent += 'export const ufs = [\n';
ufsOrdenadas.forEach((uf, index) => {
    tsContent += `  "${uf}"${index < ufsOrdenadas.length - 1 ? ',' : ''}\n`;
});
tsContent += '];\n\n';

tsContent += 'export const getMunicipiosByUF = (uf: string): string[] => {\n';
tsContent += '  return municipiosPorUF[uf] || [];\n';
tsContent += '};\n';

// Salvar arquivo
fs.writeFileSync('utils/municipios.ts', tsContent, 'utf-8');

console.log('Arquivo municipios.ts gerado com sucesso!');
console.log(`Total de UFs: ${ufsOrdenadas.length}`);
console.log(`Total de municípios: ${Object.values(byUF).flat().length}`);

