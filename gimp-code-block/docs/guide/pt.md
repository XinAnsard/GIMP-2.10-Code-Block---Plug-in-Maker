# Guia de uso — GIMP Code Block

## 🗺️ A tela da oficina

- À **esquerda**, as categorias de blocos. Clique em uma categoria para ver os blocos dela e arraste um bloco para a área de montagem.
- No **centro**, a área de montagem. Roda do mouse: rolar; Ctrl + roda: zoom; arrastar no vazio: mover.
- À **direita**, o painel: 💡 Ajuda (sobre o bloco selecionado), 🐍 Código (o Python gerado), ✅ Verificação, 🤖 IA e 🎓 Curso.
- No **alto**, os menus, a busca de blocos (tecla /) e o botão ⬇ Baixar.

## 🧩 Os formatos dos blocos

- **Bloco com encaixe**: uma ação. Ele se empilha embaixo de outro.
- **Bloco arredondado**: um valor (número, texto, camada, variável). Ele se encaixa em um buraco.
- **Bloco pontudo (hexagonal)**: uma condição verdadeiro/falso, para "se" e "enquanto".
- **Bloco em C**: ele contém outros blocos (laços, condições, atalhos).

Um bloco cinza está desativado: ele não está no código. Clique direito em um bloco: duplicar, comentar, desativar, recolher, ajuda.

## ▶ O bloco inicial

O bloco amarelo **▶ Quando eu executar** descreve seu plug-in: o nome no menu, o menu em que ele aparece, se precisa de uma imagem aberta e as configurações dele ("primeiro, perguntar").

As configurações viram a janela que o GIMP mostra antes de executar o plug-in. Use o valor delas com os blocos 🎛️ da categoria ▶ Início.

**Configurações ▸ Meu plug-in** define o resto: autor, desfazer agrupado, tratamento de erros, módulos importados.

## ⬇ Baixar e instalar

Clique em **⬇ Baixar**: você recebe um arquivo `.py`. Coloque-o na pasta de plug-ins do GIMP e reinicie o GIMP.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins`, depois `chmod +x file.py`
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

A pasta exata está em **Editar ▸ Preferências ▸ Pastas ▸ Plug-ins**. Os plug-ins feitos aqui funcionam no **GIMP 2.10** (não no GIMP 3, que tem outra API).

## 🐍 Importar um script Python

**Arquivo ▸ Importar um script Python**, ou solte o arquivo `.py` na página. Cada linha vira um bloco Python.

Garantia: enquanto você não mudar nada, o download devolve **o mesmo arquivo, byte a byte** (comentários, espaços e tabulações incluídos). Se mudar um bloco, só as linhas dele são reescritas.

Um script com erro de sintaxe é importado mesmo assim: a parte com problema vira um bloco 🧱 "código bruto" para corrigir.

## 🟠 Os blocos Python e suas pílulas

- **laranja**: variável; **violeta**: constante do GIMP; **amarelo**: função do GIMP; **verde-escuro**: outra função; blocos verdes: cálculos e comparações; espaços brancos: valores escritos como estão.

Clique em uma pílula e digite: abre uma lista de sugestões (setas ↑↓ e depois Enter, ou clique). Para uma função do GIMP, os espaços que faltam se preenchem sozinhos.

Clique direito em uma chamada de função: adicionar ou tirar um argumento. Clique direito em "se": adicionar "senão se" ou "senão".

A categoria 🐍 Python lista as variáveis do seu script e **atalhos do GIMP** prontos (desfazer agrupado, laço sobre as imagens, sobre as camadas…).

## ⚙️ As 857 funções do GIMP (PDB)

Duas formas de usá-las: o bloco "⚙️ função do GIMP" (🧰 Avançado) em um plug-in de blocos simples, ou o bloco "chamar …" nos blocos Python.

Busca: digite uma palavra em inglês ou francês (blur, layer, selection, text…). As funções mais usadas aparecem primeiro; "antiga" marca uma função obsoleta que tem substituta.

O `run_mode` nunca precisa ser informado: o pygimp o adiciona. As listas costumam ter um contador logo antes (ex.: `num_points` e depois `points`).

## ⚡ Atalhos do GIMP

Blocos que substituem o que todo script escreve à mão:
- "em um único passo de desfazer": tudo conta como um único Ctrl+Z, mesmo se der erro;
- "devolvendo depois…" as cores e ferramentas, a seleção ou a camada ativa;
- "para cada imagem aberta", "para cada camada de todas as imagens", "para cada arquivo da pasta";
- "nova camada do tamanho da imagem", "copiar a camada para outra imagem".

## ✅ Verificação e erros

A aba **✅ Verificação** relê seu plug-in a cada mudança: 🛑 erro (não funcionaria), ⚠️ vale olhar, ℹ️ informação. Clique em uma linha para ir ao bloco.

No GIMP: **Janelas ▸ Diálogos encaixáveis ▸ Console de erros** mostra os erros de Python. Os plug-ins feitos aqui também mostram o erro completo em uma mensagem.

**Filtros ▸ Python-Fu ▸ Console**: para testar uma linha de Python direto no GIMP.

## 🤖 O assistente de IA

**IA ▸ Escolher a IA**: qualquer serviço compatível (OpenAI, Anthropic, Gemini, Mistral…), uma IA local (Ollama, LM Studio) ou o modo copiar e colar, sem conexão.

Peça uma função, um plug-in inteiro, uma correção ou uma explicação. A resposta é verificada e corrigida automaticamente antes de virar blocos.

## 💾 Salvar seu trabalho

A oficina salva seu trabalho automaticamente neste navegador.

Para guardar em outro lugar ou compartilhar: **Arquivo ▸ Salvar o projeto** (arquivo `.json`). O `.py` baixado também contém a impressão digital dos blocos: ao reimportá-lo, você recupera seus blocos exatamente.

## ❓ Problemas comuns

- **O plug-in não aparece**: pasta errada, GIMP não reiniciado, arquivo não executável (Linux) ou Python-Fu ausente (Linux: pacote `gimp-python`).
- **O menu está cinza**: o plug-in precisa de uma imagem aberta (caixa do bloco ▶).
- **"argument count" / "wrong type"**: veja a aba ✅ Verificação, ela indica o número de argumentos esperado.
- **Acentos estranhos**: use os blocos de texto da oficina, eles cuidam do UTF-8 para você.

---

# Curso: de iniciante total a profissional

Cada lição explica uma ideia e depois dá uma missão. A oficina verifica sozinha quando você conseguiu.

## 🌱 Nível 1 — Primeiros passos

*Nunca programou? Perfeito, começamos aqui.*

### 1. Seu primeiro plug-in

🎯 **Fazer o GIMP dizer "Olá".**

Um **plug-in** é um pequeno programa que adiciona um comando aos menus do GIMP. Aqui você o monta encaixando blocos, como um quebra-cabeça: a oficina escreve o código Python de verdade para você.

Todo plug-in começa com o bloco amarelo **▶ Quando eu executar**. Os blocos colocados embaixo de "depois fazer" rodam **de cima para baixo**, um por um.

**Sua missão**

1. Clique no bloco abaixo para adicioná-lo: ele se encaixa sozinho embaixo de "depois fazer".
2. Clique no espaço branco da mensagem e digite seu texto.
3. Olhe a aba 🐍 Código: a linha `pdb.gimp_message(...)` apareceu.

### 2. Instale seu plug-in no GIMP

🎯 **Ver seu plug-in nos menus do GIMP e executá-lo.**

O GIMP carrega os plug-ins ao iniciar, a partir de uma pasta especial chamada **plug-ins**.
- **Windows**: `C:\Users\<you>\AppData\Roaming\GIMP\2.10\plug-ins`
- **Linux**: `~/.config/GIMP/2.10/plug-ins` (depois torne o arquivo executável: `chmod +x file.py`)
- **macOS**: `~/Library/Application Support/GIMP/2.10/plug-ins`

O caminho exato aparece no GIMP: **Editar ▸ Preferências ▸ Pastas ▸ Plug-ins**.

**Sua missão**

1. No bloco ▶, dê um nome ao seu plug-in e escolha o menu dele.
2. Clique em **⬇ Baixar** no canto superior direito.
3. Coloque o arquivo `.py` na pasta de plug-ins e **reinicie o GIMP**.
4. Abra uma imagem e procure seu plug-in no menu escolhido. Clique: sua mensagem aparece!
5. Quando funcionar, clique em "Consegui".

> 💡 O plug-in não aparece? Confira se o arquivo está mesmo na pasta de plug-ins (e não em uma subpasta a mais), se termina em .py e se o GIMP foi reiniciado. No Linux, você também precisa do pacote gimp-python.

### 3. Agir na imagem: uma nova camada

🎯 **Criar uma camada preenchida de branco na imagem.**

Uma **camada** é uma folha transparente colocada sobre a imagem. Os blocos roxos (📑 Camadas) criam e modificam camadas.

O bloco "nova camada" da categoria ⚡ Atalhos faz de uma vez o que os programadores escrevem em 3 linhas: criar a camada, adicioná-la à imagem e preenchê-la.

Repare nos ovais azuis "🖼️ imagem atual": eles são **valores**. Representam a imagem em que você executou o plug-in.

**Sua missão**

1. Adicione o bloco abaixo.
2. Mude o nome ("Minha camada") e escolha "branco" na lista.
3. Baixe, substitua o arquivo antigo no GIMP, reinicie e teste.

### 4. Fazer uma pergunta ao usuário

🎯 **Pedir um número ao iniciar e usá-lo.**

Quando um plug-in tem **configurações**, o GIMP abre uma janelinha antes de executá-lo: o usuário escolhe um número, um texto, uma cor…

As configurações ficam na parte "primeiro, perguntar" do bloco ▶. Depois, o bloco "🎛️ valor da configuração" (categoria ▶ Início) dá o que o usuário escolheu.

**Sua missão**

1. Abra a categoria **▶ Início e configurações** e arraste uma configuração "🔢 número inteiro" para "primeiro, perguntar". Dê um nome a ela, por exemplo `opacity`.
2. Adicione o bloco "opacidade de …" abaixo.
3. No espaço da porcentagem, solte o bloco 🎛️ da configuração (ele aparece na categoria ▶ Início depois que a configuração existe).

## 🌿 Nível 2 — Bases da programação

*Variáveis, laços, condições: as 3 ideias por trás de todo programa.*

### 5. Variáveis: caixas que guardam

🎯 **Guardar um valor em uma variável e usar de novo.**

Uma **variável** é uma caixa com um nome. Você guarda um valor nela (um número, um texto, uma camada…) para usar depois.

"definir `x` como 5" coloca 5 na caixa `x`. Depois disso, cada bloco `x` vale 5. Se você colocar outra coisa em `x`, o valor antigo é substituído.

Os blocos que criam algo (camada, texto, imagem) costumam ter uma seta **→ em**: o resultado é guardado em uma variável, para você poder mudá-lo depois.

**Sua missão**

1. Abra **📦 Variáveis e listas** e clique em "➕ Criar uma variável". Chame-a de `name`.
2. Adicione "definir … como …" e coloque um texto, por exemplo "Olá".
3. Adicione "💬 mostrar a mensagem" e solte nele o bloco da sua variável.

### 6. Repetir: os laços

🎯 **Criar 5 camadas de uma vez.**

O computador nunca se cansa: um **laço** executa os mesmos blocos quantas vezes você quiser.

"repetir 10 vezes" é o mais simples. "contar com `i` de 1 a 10" faz o mesmo, mas a variável `i` vale 1, depois 2, depois 3…: prático para numerar.

Os blocos em forma de **C** contêm outros blocos: tudo o que está dentro é repetido.

**Sua missão**

1. Adicione o bloco "contar com …" abaixo e coloque 5 como fim.
2. Arraste um bloco "nova camada" para **dentro** do C.
3. Bônus: no nome da camada, use "juntar … e …" (🧮 Cálculos e texto) para escrever "Camada" + `i`.

### 7. Escolher: as condições

🎯 **Fazer algo só se a imagem for mais larga do que alta.**

"**se** … **então** …" só executa os blocos de dentro se a condição for verdadeira.

Uma condição é um bloco **hexagonal** (pontudo dos dois lados): uma comparação como "… > …", "… contém …", "… e …".

Com "se … então … senão …", você escolhe entre dois caminhos.

**Sua missão**

1. Adicione "se … então".
2. No espaço pontudo, solte uma comparação "… > …".
3. À esquerda coloque "largura de imagem atual"; à direita, "altura de imagem atual".
4. Dentro do C, coloque uma mensagem "Imagem na horizontal!".

### 8. Percorrer todas as camadas

🎯 **Fazer a mesma coisa em cada camada da imagem.**

"para cada camada `layer` de imagem atual" é um laço especial: a cada volta, a variável `layer` contém **uma** camada da imagem, depois a próxima…

É assim que se renomeia, esconde ou muda 200 camadas com um clique. Com a caixa "procurar também nos grupos", as camadas guardadas em pastas também são visitadas.

**Sua missão**

1. Adicione "para cada camada".
2. Dentro, coloque "opacidade de …" e solte a variável `layer` no primeiro espaço.
3. Escolha 50%: todas as suas camadas ficam meio transparentes.

## 🌳 Nível 3 — GIMP de verdade

*Seleções, texto, várias imagens, pastas inteiras.*

### 9. Selecionar e pintar

🎯 **Preencher um retângulo com cor.**

A **seleção** (o tracejado) limita as ações a uma área. No GIMP, quase todos os filtros e preenchimentos só afetam a seleção.

As posições são contadas em pixels a partir do **canto superior esquerdo**: x para a direita, y para baixo.

Lembre-se de não selecionar nada no final, para devolver tudo limpo ao usuário.

**Sua missão**

1. Adicione "cor de frente" e escolha uma cor.
2. Adicione "selecionar um retângulo" (x 0, y 0, 200 × 100).
3. Adicione "preencher a seleção de … com cor de frente".
4. Termine com "selecionar nada".

### 10. Escrever texto

🎯 **Adicionar uma camada de texto na imagem.**

O bloco "escrever …" cria uma **camada de texto**: fonte, tamanho, cor e posição são definidos no bloco.

A camada de texto é guardada em uma variável (→ em `text`): depois você pode movê-la, mudar a opacidade dela etc.

**Sua missão**

1. Adicione o bloco "escrever".
2. Digite seu texto, um tamanho de 60 px e uma cor.
3. Bônus: use uma configuração "texto curto" para o usuário escolher o texto.

### 11. Trabalhar em todas as imagens abertas

🎯 **Aplicar uma ação a cada imagem aberta, com um desfazer limpo.**

Um plug-in não precisa trabalhar só na imagem atual. "para cada imagem aberta" passa por **todas** as imagens abertas no GIMP.

Normalmente, cada ação conta como um passo de desfazer. O atalho ⚡ agrupa tudo o que o plug-in faz em uma imagem em **um único Ctrl+Z**.

Dentro do laço, use a variável `img` no lugar de "imagem atual".

**Sua missão**

1. Adicione "para cada imagem aberta (um desfazer por imagem)".
2. Dentro, coloque "achatar …" e solte `img` no espaço dele.
3. Abra 3 imagens no GIMP e execute seu plug-in.

### 12. Processar uma pasta inteira (em lote)

🎯 **Abrir cada imagem de uma pasta, mudá-la e exportá-la em PNG.**

O **processamento em lote** é o verdadeiro superpoder dos scripts: 500 arquivos processados enquanto você toma um café.

O atalho "para cada arquivo de imagem da pasta" abre cada arquivo sem janela, executa seus blocos e depois libera a memória.

Dica: adicione uma configuração "📁 pasta a escolher" para o usuário escolher a pasta no GIMP.

**Sua missão**

1. Adicione o bloco de lote abaixo, com a extensão `.jpg`.
2. Dentro, coloque "exportar … em PNG para …" com `img`.
3. Para o caminho, junte o nome do arquivo e ".png" (🧮 Cálculos e texto).

## 🚀 Nível 4 — Rumo ao código (pro)

*Ler e escrever Python, usar as 857 funções do GIMP, depurar.*

### 13. Ler o Python que você montou

🎯 **Entender a ligação entre um bloco e as linhas de código dele.**

Cada bloco corresponde a uma ou mais linhas de **Python 2.7**, a linguagem dos plug-ins do GIMP 2.10.

Na aba 🐍 Código, **clique em um bloco**: as linhas dele se acendem. **Clique em uma linha**: o bloco dela é selecionado. É o melhor jeito de aprender a ler código.

Lembre-se: em Python, o que está **deslocado para a direita** (a indentação) fica "dentro" — exatamente como os blocos dentro de um C.
- `pdb.gimp_...(...)`: uma chamada a uma função do GIMP
- `x = ...`: um valor é guardado na variável `x`
- `for ... in ...:`: um laço; `if ...:`: uma condição

**Sua missão**

1. Abra a aba 🐍 Código.
2. Clique em três blocos diferentes e observe as linhas que se acendem.

### 14. Passar para os blocos Python

🎯 **Transformar seu plug-in em blocos Python, uma linha = um bloco.**

Os blocos simples são confortáveis, mas os blocos **Python** mostram todo o código, linha por linha, e deixam você mudar tudo.

Nos blocos Python, as cores ajudam:
- pílula **laranja**: uma variável (`image`, `layer`, `x`)
- pílula **violeta**: uma constante do GIMP (`FILL_WHITE`, `NORMAL_MODE`)
- pílula **amarela**: uma função do GIMP (`pdb.…`)
- blocos verdes: cálculos e comparações (`+`, `==`, `and`…)

Clique em uma pílula e digite algumas letras: abre uma lista de sugestões.

**Sua missão**

1. Clique no botão abaixo (ou Arquivo ▸ Ver este plug-in como blocos Python).
2. Explore: clique em uma pílula laranja e veja as variáveis sugeridas.

### 15. As 857 funções do GIMP

🎯 **Chamar uma função da PDB com os argumentos certos.**

A **PDB** (Procedure DataBase) é a lista de tudo o que o GIMP sabe fazer: 857 funções. Tudo o que você faz com o mouse no GIMP tem sua função.

Em um bloco "chamar …", clique no nome da função e digite uma palavra, em inglês ou francês: **blur**, **layer**, **text**… A lista mostra cada função com seus argumentos e uma explicação. Escolha uma: os espaços se preenchem sozinhos.

A 🔍 do bloco abre a lista completa, organizada por grupos.

Regra de ouro: o `run_mode` **nunca** é passado — o pygimp o adiciona sozinho.

**Sua missão**

1. Adicione um bloco "chamar …" (categoria 🐍 Python).
2. Clique no nome dele, digite "blur" e escolha `plug_in_gauss`.
3. Troque os 0.0 por 5.0 para um desfoque de 5 pixels.

### 16. Depurar como um profissional

🎯 **Encontrar e entender um erro.**

Todo mundo erra, até os profissionais. A diferença: eles sabem **onde olhar**.
- A aba **✅ Verificação** encontra muitos erros **antes** do GIMP: espaço vazio, número errado de argumentos, função desconhecida… Clique em um problema para ver o bloco.
- No GIMP, os erros aparecem em **Janelas ▸ Diálogos encaixáveis ▸ Console de erros**.
- Para ver o valor de uma variável durante a execução, mostre-o: `pdb.gimp_message(str(x))`.
- **Filtros ▸ Python-Fu ▸ Console** permite testar uma linha de Python direto no GIMP.

Leia os erros **de baixo para cima**: a última linha diz o que está errado, a de cima diz onde.

**Sua missão**

1. Abra a aba ✅ Verificação.
2. Adicione um "chamar …" para `pdb.gimp_message` e coloque uma variável nele, por exemplo `str(image.width)`.

### 17. Escreva suas próprias funções

🎯 **Guardar um pedaço de código em uma função e chamá-la.**

Quando você repete as mesmas linhas em vários lugares, guarde-as em uma **função**: "definir `my_function(layer)`". Depois, um único bloco "chamar `my_function(...)`" faz tudo.

Os **parâmetros** (entre parênteses) são variáveis preenchidas no momento da chamada. "retornar …" devolve um resultado.

Um bom nome de função diz o que ela faz: `make_grey`, `number_layers`… Suas funções também aparecem nas sugestões.

**Sua missão**

1. Adicione "definir …" com o nome `griser` e o parâmetro `calque`.
2. Dentro, chame `pdb.gimp_drawable_desaturate(calque, DESATURATE_LUMINANCE)`.
3. Em outro lugar, chame `griser(drawable)`.

### 18. Importar, mudar, compartilhar

🎯 **Abrir um script real existente e mudá-lo sem quebrar.**

Achou um plug-in na Internet? **Arquivo ▸ Importar um script Python**: cada linha vira um bloco, e o download devolve **exatamente o mesmo arquivo** enquanto você não mudar nada. Se mudar um bloco, só as linhas dele mudam.

O **assistente de IA** (aba 🤖) pode escrever uma função, explicar um script ou corrigir um erro. As respostas dele são verificadas (Python 2.7, funções reais do GIMP, número certo de argumentos) antes de virar blocos.

Agora você sabe ler, escrever e corrigir plug-ins do GIMP. Próximo passo: abra scripts de outras pessoas, leia bloco por bloco e construa os seus. **Parabéns!**

**Sua missão**

1. Importe um script `.py` (ou um exemplo: Arquivo ▸ Exemplos, depois converta).
2. Mude um valor e veja na aba 🐍 Código quais linhas mudaram.
3. Quando terminar, clique em "Consegui".

