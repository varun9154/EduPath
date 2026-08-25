# EduPath Multi-LLM AI Counsellor — Production Architecture

## Purpose

EduPath AI Counsellor accepts free-form student questions and returns a practical answer grounded in the EduPath verified datasets.

## Four-provider architecture

The service integrates four independent LLM providers:

1. **OpenAI** — default general-purpose/reasoning route.
2. **Anthropic Claude** — preferred for technical, coding, architecture and DevSecOps questions.
3. **Google Gemini** — preferred for education/admission/career questions.
4. **Groq** — preferred for short, latency-sensitive questions and used as a fast fallback.

The application does **not** call all four providers for every user message. It selects the best configured provider for the request and automatically falls back to the remaining configured providers when a provider fails or times out. This avoids multiplying AI cost and latency for every student request while still giving the application multi-provider resilience.

## Request flow

`Student text -> API validation -> rate limit -> local dataset retrieval -> prompt/guardrails -> provider routing -> LLM -> verified citations + response -> UI`

### Local grounding

The route retrieves relevant records from:

- `src/data/exams.json`
- `src/data/courses.json`
- `src/data/states.json`

The selected records are inserted into the system context. The model is explicitly instructed not to invent changing admission facts, fees, cutoffs, dates, rankings or official links.

## Provider failure strategy

- Provider timeout: move to the next configured provider.
- Provider HTTP error: move to the next configured provider.
- Empty model response: move to the next provider.
- All providers unavailable: return a deterministic EduPath dataset fallback so the page does not break.

## Environment variables

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5

GOOGLE_AI_API_KEY=
GEMINI_MODEL=gemini-3.7-flash

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

AI_PROVIDER_TIMEOUT_MS=12000
```

At least one provider key should be configured. For the strongest production resilience, configure all four.

## Security

- API keys are server-only environment variables.
- The browser never receives provider keys.
- User input is length limited.
- Conversation history is bounded before being sent to a provider.
- A lightweight per-instance request limiter prevents accidental request storms.
- Provider errors are logged server-side without returning secrets to students.

## Scaling note

The in-memory limiter is intentionally dependency-free. It is not a global distributed rate limiter across all Vercel instances. For larger public traffic, add a Vercel/edge-level rate limit or WAF rule. Do not use Excel as an AI request counter.

## Current API notes

The OpenAI integration uses the v1 Chat Completions endpoint and supports modern reasoning model token parameters. Groq exposes an OpenAI-compatible Chat Completions endpoint. Google Gemini's `generateContent` API remains supported, although Google's current documentation recommends its Interactions API for new projects. The adapter is isolated so the Gemini transport can be upgraded independently without changing the chat UI or provider routing layer.
