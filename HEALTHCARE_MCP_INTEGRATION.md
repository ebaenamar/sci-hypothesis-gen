# Healthcare MCP Integration

## Descripción

Este proyecto puede integrarse con [Healthcare MCP Server](https://github.com/Cicatriiz/healthcare-mcp-public) para mejorar el retrieval de papers científicos y datos médicos.

## ¿Qué es Healthcare MCP?

Healthcare MCP es un servidor que implementa el **Model Context Protocol (MCP)** y proporciona acceso a:

- ✅ **PubMed** - Base de datos de artículos científicos médicos
- ✅ **medRxiv** - Pre-prints biomédicos
- ✅ **NCBI Bookshelf** - Libros y documentos biomédicos
- ✅ **Clinical Trials** - Ensayos clínicos registrados
- ✅ **FDA Drug Info** - Información de medicamentos
- ✅ **ICD-10 Codes** - Terminología médica

## Ventajas vs Sistema Actual

### Sistema Actual
- Semantic Scholar, PubMed, arXiv, CrossRef
- Rate limits frecuentes (429 errors)
- Implementación básica
- APIs independientes sin unificación

### Con Healthcare MCP
- API unificada para múltiples fuentes
- Caching automático y connection pooling
- Rate limiting inteligente
- Enfoque específico en datos médicos
- Mejor manejo de errores

## Instalación

### 1. Clonar el repositorio Healthcare MCP

```bash
cd /tmp
git clone https://github.com/Cicatriiz/healthcare-mcp-public.git
cd healthcare-mcp-public
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno (opcional)

```bash
cp .env.example .env
# Editar .env si necesitas API keys específicas para PubMed, etc.
```

### 4. Iniciar el servidor MCP

```bash
# En modo desarrollo
npm run dev

# O en modo producción
npm run build
npm start
```

El servidor se iniciará en `http://localhost:3000` por defecto.

## Uso en Sci-Hypothesis-Gen

### Opción 1: Usar el cliente MCP (Ya incluido)

El archivo `src/data/healthcare-mcp-client.ts` ya está creado. Para usarlo:

```typescript
import { HealthcareMCPClient } from './data/healthcare-mcp-client.js';

// Crear cliente
const mcpClient = new HealthcareMCPClient('http://localhost:3000');

// Verificar que el servidor está corriendo
const isRunning = await mcpClient.healthCheck();
console.log('MCP Server running:', isRunning);

// Buscar papers en PubMed
const results = await mcpClient.searchPubMed(
  'congenital heart disease',
  10,  // max results
  '5'  // last 5 years
);

// Búsqueda comprehensiva en todas las fuentes
const allResults = await mcpClient.searchAll(
  'pediatric genomics',
  5
);
console.log('Total results:', allResults.totalResults);
console.log('PubMed:', allResults.pubmed.length);
console.log('medRxiv:', allResults.medrxiv.length);
console.log('NCBI:', allResults.ncbi.length);
```

### Opción 2: Integrar con DataRetrieval existente

Modificar `src/data/retrieval.ts` para usar Healthcare MCP como backend:

```typescript
import { HealthcareMCPClient } from './healthcare-mcp-client.js';

export class DataRetrieval {
  private mcpClient?: HealthcareMCPClient;
  
  constructor(private dataSources: DataSourceConfig[]) {
    // Intentar conectar al servidor MCP
    this.initMCP();
  }
  
  private async initMCP() {
    try {
      this.mcpClient = new HealthcareMCPClient();
      const isRunning = await this.mcpClient.healthCheck();
      if (isRunning) {
        console.log('✅ Healthcare MCP Server connected');
      }
    } catch (error) {
      console.log('⚠️  Healthcare MCP not available, using fallback');
    }
  }
  
  async searchPapers(query: string): Promise<Paper[]> {
    // Si MCP está disponible, usarlo
    if (this.mcpClient) {
      try {
        const results = await this.mcpClient.searchAll(query, 10);
        return this.convertMCPResultsToPapers(results);
      } catch (error) {
        console.warn('MCP search failed, falling back...');
      }
    }
    
    // Fallback al sistema original
    return this.searchPapersOriginal(query);
  }
}
```

## Configuración Recomendada

### Para desarrollo local

```bash
# Terminal 1: Iniciar Healthcare MCP Server
cd /path/to/healthcare-mcp-public
npm run dev

# Terminal 2: Iniciar tu sistema
cd /path/to/sci-hypothesis-gen
npm run generate single -- \
  --dataset /path/to/dataset.csv \
  --keywords pediatric genomics \
  --output ./output
```

### Para producción

Puedes desplegar el Healthcare MCP Server como:
- **Docker container**
- **Servicio systemd**
- **Cloud service (AWS, GCP, Azure)**

## Ejemplos de Uso

### Buscar papers relacionados con una hipótesis

```typescript
// Cuando generas una hipótesis
const hypothesis = await agent.generateHypothesis(['neural', 'plasticity']);

// Buscar papers relacionados usando MCP
const mcpClient = new HealthcareMCPClient();
const relatedPapers = await mcpClient.searchPubMed(
  hypothesis.title,
  20,
  '3'  // últimos 3 años
);

// Buscar ensayos clínicos relacionados
const trials = await mcpClient.searchClinicalTrials(
  'neural plasticity therapy',
  'recruiting',
  10
);

console.log(`Found ${relatedPapers.length} papers`);
console.log(`Found ${trials.length} clinical trials`);
```

### Validar novedad de hipótesis

```typescript
async function validateNovelty(hypothesis: Hypothesis): Promise<number> {
  const mcpClient = new HealthcareMCPClient();
  
  // Buscar en múltiples fuentes
  const [pubmed, medrxiv, ncbi] = await Promise.all([
    mcpClient.searchPubMed(hypothesis.title, 50),
    mcpClient.searchMedRxiv(hypothesis.title, 20),
    mcpClient.searchNCBIBookshelf(hypothesis.title, 10),
  ]);
  
  // Calcular similaridad
  const allPapers = [...pubmed, ...medrxiv, ...ncbi];
  const maxSimilarity = calculateMaxSimilarity(hypothesis, allPapers);
  
  // Novelty score: 1 - max_similarity
  return 1 - maxSimilarity;
}
```

## API Endpoints del Healthcare MCP

Si prefieres usar HTTP directo en lugar del cliente TypeScript:

### Buscar en PubMed
```bash
curl -X POST http://localhost:3000/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pubmed_search",
    "arguments": {
      "query": "congenital heart disease",
      "max_results": 10,
      "date_range": "5"
    }
  }'
```

### Buscar en medRxiv
```bash
curl -X POST http://localhost:3000/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "medrxiv_search",
    "arguments": {
      "query": "pediatric genomics",
      "max_results": 10
    }
  }'
```

### Buscar Clinical Trials
```bash
curl -X POST http://localhost:3000/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "clinical_trials_search",
    "arguments": {
      "condition": "congenital heart disease",
      "status": "recruiting",
      "max_results": 10
    }
  }'
```

## Troubleshooting

### Error: "Cannot connect to MCP server"
- Verifica que el servidor esté corriendo: `curl http://localhost:3000/health`
- Revisa el puerto en la configuración
- Chequea los logs del servidor MCP

### Error: Rate limit (429)
- El Healthcare MCP tiene rate limiting interno
- Ajusta los parámetros de PQueue en el cliente
- Considera usar caching local

### Parsing errors
- Los métodos `parseXXXResults()` en `healthcare-mcp-client.ts` necesitan implementación completa
- Adapta el parsing según el formato exacto de respuesta del MCP server

## Próximos Pasos

1. ✅ Código cliente creado (`src/data/healthcare-mcp-client.ts`)
2. ⏳ Instalar y probar Healthcare MCP Server localmente
3. ⏳ Implementar parsing completo de respuestas
4. ⏳ Integrar con DataRetrieval existente
5. ⏳ Agregar tests de integración
6. ⏳ Documentar benchmarks de performance

## Referencias

- [Healthcare MCP Repository](https://github.com/Cicatriiz/healthcare-mcp-public)
- [Model Context Protocol Docs](https://mcp.so/)
- [PubMed API Docs](https://www.ncbi.nlm.nih.gov/books/NBK25500/)
- [medRxiv API](https://api.medrxiv.org/)

## Contribuir

Para mejorar la integración:
1. Implementa parsing completo de respuestas MCP
2. Agrega tests de integración end-to-end
3. Documenta benchmarks vs sistema actual
4. Optimiza rate limiting y caching
