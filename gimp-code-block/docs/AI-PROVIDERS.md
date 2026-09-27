# AI providers

The assistant is **not tied to any vendor**. The provider list in ⚙️ *AI settings* only
pre-fills an address and a model name; everything stays editable, and
**"Any other AI"** lets you describe an arbitrary HTTP API.

## Ready-made shortcuts

| Shortcut | Notes |
| --- | --- |
| Claude, built into the page | Only in the published claude.ai page; no key, asks consent |
| Copy and paste | No connection at all: the app gives you the full prompt, you paste the answer back |
| OpenAI, Anthropic, Gemini, Mistral, OpenRouter, DeepSeek, Groq | Need an API key from that vendor |
| Ollama, LM Studio | Local, no key |

## Any other AI

Set the address, then open *Advanced settings*:

- **Dialect** — OpenAI-compatible, native Ollama (`/api/chat`), Anthropic, Gemini.
- **Request path** — e.g. `/chat/completions`, `/api/chat`, `/my/endpoint`.
- **Authentication** — none, `Authorization: Bearer`, `x-api-key`, `?key=` in the URL, or
  a header you name yourself with the prefix you want.
- **Extra headers** — JSON, or one `Name: value` per line.
- **Request body** — leave empty for the dialect's default, or write the JSON yourself
  with these variables:

  | Variable | Value |
  | --- | --- |
  | `{{model}}` | model name |
  | `{{system}}` | system prompt (string) |
  | `{{prompt}}` | the last user message (string) |
  | `{{messages}}` | `[{role, content}, …]` without the system message |
  | `{{messages_with_system}}` | same, with the system message first |
  | `{{contents}}` | Gemini-shaped conversation |
  | `{{temperature}}` | number |

- **Response path** — where the text lives in the JSON answer, e.g.
  `data.sortie.0.texte`. Leave empty and the app tries a dozen common shapes
  (`choices.0.message.content`, `message.content`, `content.0.text`,
  `candidates.0.content.parts.0.text`, `output_text`, `response`, …).

Example, a home-made API:

```
Address        https://my-server.example/api
Dialect        OpenAI-compatible
Path           /generate
Authentication custom header  ·  name: X-My-Key  ·  prefix: (empty)
Body           {"model": "{{model}}", "prompt": "{{prompt}}",
                "system": "{{system}}", "temp": {{temperature}}}
Response path  data.output.0.text
```

## Local models: CORS

A browser refuses cross-origin calls unless the server allows them:

- **Ollama** — start it with `OLLAMA_ORIGINS=*` (Windows: set the environment variable and
  restart Ollama; Linux/macOS: `OLLAMA_ORIGINS=* ollama serve`).
- **LM Studio** — enable CORS in the local server settings.
- **llama.cpp server** — `--host 0.0.0.0` plus its CORS flag, or put it behind a proxy
  that adds `Access-Control-Allow-Origin`.

## Published page vs local file

The claude.ai published page has a content-security policy that blocks calls to other
sites, so only the built-in Claude and copy-and-paste work there. Use
*File ▸ Download the workshop* (or build the file yourself) and open it locally to reach
any other provider.

## What the app does with the answer

The reply is parsed, then checked: Python 2.7 syntax, no `print`, no ternary, no `break`,
no `nonlocal`, no f-string, PDB procedures that exist in GIMP 2.10, exact argument counts,
run-mode never passed, deprecation warnings. If anything fails, the problems are sent back
to the model (twice at most) before the code is turned into blocks. Keys are stored in
`sessionStorage` unless you tick "remember", and are only ever sent to the address you set.
