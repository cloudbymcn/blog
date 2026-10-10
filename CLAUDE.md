# CLAUDE.md

## Regras e continuidade

- Leia o `AGENTS.md` do projeto e os adicionais aplicáveis aos arquivos
  que for editar. Eles definem stack, comandos, testes e regras do repo.
- Antes de iniciar ou retomar trabalho, leia `docs/PROJECT_STATUS.md`.
  Se não existir, crie um resumo baseado no estado real do projeto.
- Confira arquivos e Git; não dependa da memória do chat ou do terminal.
- Atualize PROJECT_STATUS ao iniciar, após cada alteração lógica,
  após validações e antes de delegar, trocar de terminal ou encerrar.
  Não espere o commit.
- Registre objetivo, frentes/responsáveis, arquivos alterados, validações,
  bloqueios, próximo passo e, quando houver Git, branch, commit relevante
  e alterações não commitadas. Nunca declare testes não executados.
- Antes de editar o status, releia e preserve as outras frentes.
  O orquestrador coordena as escritas para evitar alterações simultâneas.
- Todo novo agente deve ler CLAUDE.md, AGENTS.md e PROJECT_STATUS
  antes de agir.

## Maestri: visibilidade e organização

O trabalho deve ser acompanhado no canvas, sem acumular itens obsoletos.
A CLI `maestri` está no PATH; se não achar, use "$MAESTRI_CLI".
Consulte a ajuda quando necessário; não invente comandos ou opções.

### 1. Início e nota única

- Primeira ação: `maestri list`.
- Localize e atualize `Status: <projeto>` antes de executar a tarefa.
  Use `maestri note edit`; crie com `maestri note create` só se não existir.
- Mantenha UMA nota ativa por projeto, com objetivo, checklist,
  frentes, resultados e próximo passo. Reutilize também em tarefas pequenas.
- Consolide notas antigas de status: preserve informações relevantes
  em PROJECT_STATUS e remova as duplicadas do canvas.
- Preserve notas pessoais, especificações e referências.

### 2. Agentes no canvas

- Pedido de agentes ou paralelismo exige terminais visíveis.
  Nunca substitua por subagentes internos nem execute sozinho em silêncio.
- Consulte `maestri preset list` e `maestri role list`, depois recrute:
  `maestri recruit "Codinome" --preset "<preset>" --role "<papel>"`.
- Delegue com `maestri ask`, informando escopo, arquivos sob responsabilidade
  e leitura obrigatória do contexto. Não peça confirmação para recrutar
  agentes já solicitados.
- Conecte cada agente à nota única com `maestri connect`.
  O orquestrador consolida os retornos na nota.
- Se o recrutamento falhar, pare e informe a razão exata.
- Use presets em bypass. Se precisar sobrescrever o comando:
  `--command "claude --permission-mode bypassPermissions"`.

### 3. Portais e prévias

- Navegação somente pelos portais do Maestri.
  Proibido WebSearch, WebFetch, curl, Playwright e navegadores invisíveis.
- Consulte os portais existentes e reutilize antes de criar outro.
- Mantenha UMA prévia por projeto, atualizada com o resultado mais recente.
  Não abra outra a cada modificação ou validação.
- Cada agente que precisar pesquisar usa um portal próprio e temporário,
  reutilizando-o durante a pesquisa e fechando-o ao terminar.
- Portais extras só para pesquisa ou comparação necessária.
  Registre conclusões na nota antes de fechá-los.
- Não acumule imports, screenshots ou prévias antigas. Preserve capturas
  apenas para problemas abertos ou por pedido de Matheus.
- Limpe itens obsoletos do trabalho; preserve os de Matheus e outras tarefas.

### 4. Fechamento

- Atualize PROJECT_STATUS e a nota única com resultado, validações
  e pendências.
- Limpe notas duplicadas e portais temporários; deixe apenas a nota atual
  e, quando houver, a prévia mais recente.
- Dispense os agentes concluídos com `maestri dismiss "Codinome"`.
- Avise Matheus com `maestri notify "<mensagem>"`.
- Se a CLI não suportar alguma limpeza, registre a limitação e evite
  criar novas duplicatas.
