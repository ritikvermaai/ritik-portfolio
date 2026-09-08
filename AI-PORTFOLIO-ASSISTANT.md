# AI Portfolio Assistant

The public website now includes a floating **Ask AI** assistant. It answers questions using the portfolio's current MongoDB content: projects, case studies, skills, education, experience, achievements and public contact links.

## How it works

- `POST /api/assistant` is the only public assistant endpoint.
- The OpenAI API key is used only on the Node backend and is never shipped to the browser.
- The backend sends the current portfolio context with the visitor's question.
- Responses use the OpenAI Responses API with `store: false`.
- If `OPENAI_API_KEY` is not configured, the assistant automatically falls back to a local portfolio-aware answerer, so the button still works.
- A rate limit of 25 assistant requests per IP per 15 minutes is applied.

## Render environment variables

Add these to the backend service:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

Do **not** put the key in `frontend/.env` or client-side JavaScript.

The default model is `gpt-5.6-luna`, which is intended for cost-sensitive, high-volume workloads. You can change `OPENAI_MODEL` later without changing the code.
