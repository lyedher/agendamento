# Prompt Detalhado para Reconstrução do Aplicativo "Agendamento"

## 1. Visão Geral do Aplicativo

**Nome do App:** Agendamento

**Objetivo Principal:** Construir um sistema de gerenciamento de escalas para uma unidade de polícia militar (Batalhão). O sistema deve permitir que policiais se voluntariem para escalas de serviço extraordinário (SER / AC-4), visualizem suas escalas ordinárias e confirmadas, e que administradores gerenciem todo o efetivo, criem escalas, gerem relatórios e configurem o sistema.

**Público-Alvo:**
1.  **Policiais (Usuários Padrão):** Oficiais que usarão o sistema para se voluntariar para escalas e consultar suas informações.
2.  **Administradores (Usuários Admin):** Pessoal responsável pela criação de escalas, gerenciamento do efetivo e geração de relatórios operacionais.

**Tecnologias:**
*   **Frontend:** Next.js (App Router), React, TypeScript.
*   **UI:** Tailwind CSS, shadcn/ui (componentes pré-estilizados).
*   **Ícones:** `lucide-react`.
*   **Banco de Dados:** Firestore (Firebase).
*   **Autenticação:** Gerenciada via Firestore (comparação de e-mail/senha), com controle de acesso baseado em cookies.

## 2. Funcionalidades Detalhadas

### 2.1. Autenticação e Perfil de Usuário

*   **Cadastro (`/signup`):**
    *   Formulário com os seguintes campos: Foto (upload), Posto/Graduação, RG, Nome de Guerra, Nome Completo, Função, Equipe de Trabalho inicial, CPF, Telefone, E-mail e Senha.
    *   O CPF é usado como ID único do documento no Firestore.
    *   Validações de campos, incluindo máscaras para CPF, RG e telefone.
    *   Após o cadastro, o usuário é direcionado para a página de login.

*   **Login (`/`):**
    *   Formulário com E-mail e Senha.
    *   Ao logar, um cookie `user_id` (com o CPF do usuário) é criado.
    *   Redireciona para `/admin/dashboard` se o usuário for admin, ou para `/dashboard` para usuários padrão.

*   **Esqueci a Senha (`/forgot-password`):**
    *   Página simples com um campo de e-mail para iniciar o fluxo de redefinição (a lógica de envio de e-mail é um placeholder).

*   **Meu Perfil (`/profile`):**
    *   Permite ao usuário editar suas informações: Foto, Nome de Guerra, Nome Completo, Telefone e Senha.
    *   Campos como Posto/Graduação, RG, CPF e E-mail não são editáveis pelo usuário padrão.

### 2.2. Visão do Usuário Padrão (Policial)

*   **Painel Principal (`/dashboard`):**
    *   Exibe uma lista de todas as escalas (SER) para as quais o policial está atualmente inscrito e confirmado.
    *   Deve ser a primeira página vista após o login.

*   **Agendamento de Escalas SER (`/agendamento`):**
    *   **Interface Principal:** Um calendário mensal.
    *   **Navegação:** O usuário pode navegar entre os meses.
    *   **Visualização:** Dias com escalas disponíveis são marcados no calendário.
    *   **Interação:** Ao clicar em um dia, uma lista de escalas disponíveis para aquele dia é exibida.
    *   **Regras de Inscrição:**
        *   Um policial pode se inscrever em uma escala se houver vagas.
        *   **Detecção de Conflito:** O sistema deve impedir a inscrição se o horário da nova escala sobrepuser o horário de outra escala em que o policial já está inscrito.
        *   **Limite Mensal:** O sistema deve respeitar um limite de escalas por mês, configurável pelo administrador. O cálculo desse limite deve ser feito com base no mês da escala em que se está tentando inscrever, não no mês atual.
    *   **Cancelamento:** O usuário pode cancelar sua inscrição, mas apenas se o fizer antes do início da escala.

*   **Cálculo de AC-4 (`/ac4`):**
    *   Exibe o valor total a receber por serviços extraordinários realizados.
    *   **Filtro de Período:** Permite ao usuário selecionar um intervalo de datas para o cálculo. Por padrão, exibe o mês corrente.
    *   Para cada escala no período, mostra um detalhamento dos valores por tipo de hora (Diurno/Noturno, Azul/Vermelha).
    *   **Simulador:** Inclui uma ferramenta para simular o valor de uma escala fictícia, com base em data e horários de início/fim.

*   **Cálculo de Pontuação (`/pontuacao`):**
    *   Um formulário detalhado onde o policial pode inserir dados de sua carreira (cursos, medalhas, tempo de serviço, punições, etc.) para calcular uma pontuação funcional.
    *   Os dados são salvos por usuário e podem ser editados.

### 2.3. Visão do Administrador (`/admin`)

*   **Painel de Administração (`/admin/dashboard`):**
    *   Interface com abas para gerenciar diferentes aspectos do sistema.
    *   **Gerenciar Escalas SER:**
        *   **Criação:** Permite criar novas escalas extraordinárias, definindo nome, horários, capacidade e as datas de ocorrência (selecionando múltiplos dias em um calendário). Permite seleções rápidas como "mês todo" ou "dias de semana".
        *   **Visualização/Edição:** Lista as escalas criadas, agrupadas por dia. Permite editar detalhes de uma escala (horários, capacidade) e gerenciar os voluntários manualmente (adicionar/remover policiais). Permite excluir escalas.
    *   **Configurações:**
        *   **Valores AC-4:** Formulário para definir os valores/hora para os cálculos (Diurno Azul, Noturno Azul, Diurno Vermelho, Noturno Vermelho).
        *   **Janela de Agendamento:** Permite definir uma data/hora de início e fim para o período em que os policiais podem se inscrever/cancelar escalas.
        *   **Limite de Escalas:** Campo para definir o número máximo de escalas SER que um policial pode se inscrever por mês.
    *   **Escala Ordinária (Batalhão):**
        *   Visualização de calendário mensal da escala 24/72 das equipes (ALPHA, BRAVO, CHARLIE, DELTA).
        *   Mostra qual equipe está de serviço em cada dia.
        *   Lista os policiais da equipe de serviço, considerando afastamentos.
        *   **Gerenciar Afastamentos:** Ferramenta para registrar períodos de afastamento (férias, licença, etc.) para os policiais, que serão refletidos automaticamente nas escalas.
    *   **Efetivo:**
        *   Lista completa de todos os usuários cadastrados com funcionalidade de busca.
        *   Permite editar qualquer dado de um usuário (incluindo Posto/Graduação, RG, etc.).
        *   **Importação em Massa:** Ferramenta para importar usuários a partir de uma planilha `.xlsx`, com um modelo para download.
    *   **Agendamentos (Visão Admin):**
        *   Lista todos os policiais que têm agendamentos, agrupados por policial. Permite navegar por mês para ver quem está escalado e quando.

*   **Geração de Relatórios:**
    *   **Relatório de Escalas AC-4 (`/admin/report`):** Gera um relatório formatado para impressão com todas as escalas SER e seus voluntários para um período selecionado. O layout deve ser profissional (cabeçalho oficial, etc.).
    *   **Relatório de Escalas Ordinárias (`/admin/battalion-report`):** Gera um relatório para impressão da escala diária do batalhão para um período selecionado.
    *   **Relatório de Efetivo (`/admin/users-report`):** Gera uma lista completa do efetivo para impressão.

## 3. Estrutura de Dados (Firestore)

*   **`users/{userId}`:**
    *   `userId` é o CPF do usuário (sem máscara).
    *   **Campos:** `photo`, `rank`, `rg`, `nickname`, `fullName`, `jobFunction`, `teamHistory` (array de objetos `{ team, effectiveDate }`), `taxId`, `phone`, `email`, `password`, `sortOrder`.

*   **`schedules/{scheduleId}`:**
    *   `scheduleId` é uma string composta, ex: `2024-10-25_NOME-DA-ESCALA`.
    *   **Campos:** `scheduleName`, `startTime` (Timestamp), `endTime` (Timestamp), `capacity` (number), `userIds` (array de strings com os IDs dos usuários), `status` ('active' ou 'canceled').

*   **`settings/ac4Rates`:**
    *   Documento único para armazenar os valores da AC-4 (`blueDay`, `blueNight`, `redDay`, `redNight`).

*   **`settings/scheduleSettings`:**
    *   Documento único para configurações de agendamento (`schedulingStartDate`, `schedulingEndDate`, `maxSchedulesPerUser`).

*   **`absences/{absenceId}`:**
    *   Coleção para armazenar registros de afastamento.
    *   **Campos:** `officerId`, `reason`, `startDate` (Timestamp), `endDate` (Timestamp).

*   **`pontuacoes/{userId}`:**
    *   Documento para salvar os dados da ficha de pontuação de cada usuário.

## 4. Estilo e UI/UX

*   **Paleta de Cores:**
    *   **Primária:** Azul suave (`#79A3B1`).
    *   **Fundo:** Cinza claro (`#F0F4F5`).
    *   **Acento/Destaque:** Verde claro (`#ACC18A`).
    *   Usar variáveis CSS HSL no `globals.css` para o tema.
*   **Fontes:**
    *   **Corpo:** 'Inter'.
    *   **Títulos:** 'Space Grotesk'.
*   **Layout:**
    *   Limpo, moderno e intuitivo, com uso de componentes `Card` para agrupar informações.
    *   Uso de `Dialog` e `AlertDialog` para ações de edição e confirmação.
    *   Uso de `Accordion` para expandir detalhes sem poluir a tela.
    *   O layout deve ser responsivo e funcionar bem em dispositivos móveis.
*   **Experiência do Usuário:**
    *   Feedback claro para o usuário usando `Toast` para sucesso e erro.
    *   Indicadores de carregamento (`Loader2`) em botões durante operações assíncronas.
    *   Uso de máscaras de entrada para facilitar a digitação de dados formatados.

## 5. Regras de Negócio Importantes

*   **Cálculo de Equipe do Dia:** A escala ordinária (24/72) segue um ciclo de 4 equipes. A lógica deve calcular qual equipe está de serviço em qualquer data, baseando-se em uma data e equipe de referência (ex: `01/09/2025` é `CHARLIE`).
*   **Cálculo de AC-4:** Deve seguir a regra de "escala azul" (dias de semana) e "escala vermelha" (fins de semana e feriados), com valores diferentes para horas diurnas e noturnas (noturno é das 22h às 05h).
*   **Tratamento de Datas:** Todas as datas devem ser tratadas com cuidado em relação aos fusos horários. Usar `date-fns` e `date-fns-tz` com o fuso 'America/Sao_Paulo' para garantir consistência.

Este prompt deve fornecer a uma IA uma base sólida para recriar o aplicativo com alta fidelidade.
