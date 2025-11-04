# CutPieceLabelPrinter Component

## Descrição
Componente para impressão de etiquetas com QR codes das peças cortadas de uma Ordem de Serviço específica.

## Funcionalidades

### ✅ Implementadas
- **Renderização de QR Codes**: Cada peça cortada exibe seu QR code usando o wrapper `lib/qrcode-react.tsx`
- **Seleção Múltipla**: Permite selecionar várias peças para impressão em lote
- **Impressão Individual**: Botão para imprimir etiqueta de uma peça específica
- **Impressão em Lote**: Botão para imprimir todas as peças selecionadas
- **Interface Responsiva**: Layout adaptável para diferentes tamanhos de tela
- **Status Visual**: Exibe status das peças com badges coloridos
- **Carregamento Automático**: Carrega automaticamente as peças da OS quando necessário

### 🎨 Layout da Etiqueta
Cada etiqueta impressa contém:
- **Nome do Material**
- **ID da Peça** (em destaque)
- **Dimensões** (largura × altura × espessura)
- **QR Code** (180×180px)
- **Número da OS**
- **Localização**
- **Descrição** (se disponível)

## Uso

### Importação
```tsx
import CutPieceLabelPrinter from '../components/CutPieceLabelPrinter';
```

### Uso Básico
```tsx
<CutPieceLabelPrinter 
  serviceOrderId="OS-2024-001"
  onClose={() => setShowPrinter(false)}
/>
```

### Integração com Modal
```tsx
import Modal from '../components/ui/Modal';

<Modal 
  isOpen={showCutPiecePrinter}
  onClose={() => setShowCutPiecePrinter(false)}
  title="Impressão de Etiquetas - Peças Cortadas"
  size="xl"
>
  <CutPieceLabelPrinter 
    serviceOrderId={order.id}
    onClose={() => setShowCutPiecePrinter(false)}
  />
</Modal>
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `serviceOrderId` | `string` | ✅ | ID da Ordem de Serviço para carregar as peças |
| `onClose` | `() => void` | ❌ | Callback para fechar o componente |

## Dependências

### Tipos Necessários
- `CutPiece` interface (definida em `types.ts`)
- `CutPieceStatus` type (definido em `types.ts`)
- `cutPieceStatusMap` (definido em `config/statusMaps.ts`)

### Contexto
- `useData()` hook para acessar:
  - `cutPieces`: Array de peças cortadas
  - `materials`: Array de materiais
  - `loadCutPiecesForOS()`: Função para carregar peças

### Componentes UI
- `Card`, `CardHeader`, `CardContent`
- `Button`
- `StatusBadge`
- `QRCode` (de `lib/qrcode-react.tsx`)

## Fluxo de Impressão

1. **Renderização**: QR codes são renderizados usando canvas
2. **Captura**: `canvas.toDataURL('image/png')` gera imagem PNG
3. **Nova Janela**: `window.open()` cria janela de impressão
4. **HTML Formatado**: Gera HTML com CSS otimizado para impressão
5. **Impressão**: `window.print()` abre diálogo de impressão

## Estados do Componente

- **Loading**: Exibe spinner enquanto carrega peças
- **Empty**: Exibe mensagem quando não há peças
- **Loaded**: Exibe grid com todas as peças da OS
- **Selected**: Destaca peças selecionadas para impressão

## Responsividade

- **Mobile**: 1 coluna
- **Tablet**: 2 colunas  
- **Desktop**: 3 colunas

## Acessibilidade

- Cards clicáveis para seleção
- Botões com estados disabled apropriados
- Labels descritivos para screen readers
- Contraste adequado para status badges
