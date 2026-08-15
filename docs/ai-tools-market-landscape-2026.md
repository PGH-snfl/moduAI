# 사용자 맞춤 AI 도구 서비스 시장 조사

> 조사 기준일: 2026년 8월 11일  
> 조사 목적: 사용자 맞춤 AI 도구를 기획·제작·배포·운영할 때 활용할 수 있는 주요 서비스와 권장 기술 구성을 파악한다.

## 1. 요약

AI 도구 시장은 하나의 제품군이 아니라 다음 여덟 개 계층으로 구성된다.

1. AI 코딩·개발 도구
2. 프롬프트 기반 앱 빌더
3. AI 모델 및 API
4. 노코드 AI 에이전트·챗봇 플랫폼
5. 업무 자동화 플랫폼
6. 에이전트 개발 프레임워크
7. 데이터베이스·RAG·검색 인프라
8. 배포·관측·보안·결제 인프라

초기 사용자 맞춤 AI 제품에는 모든 계층의 전문 서비스를 도입할 필요가 없다. 현재 가장 균형 잡힌 기본 구성은 다음과 같다.

- 개발: OpenAI Codex
- 웹 애플리케이션: Next.js 또는 React + FastAPI
- AI: OpenAI Responses API
- 데이터베이스·인증: Supabase
- 배포: Vercel + 필요 시 Railway 또는 Cloudflare
- 자동화: n8n
- AI 관측: Langfuse
- 오류 추적: Sentry
- 결제: 토스페이먼츠 또는 포트원, 해외 판매 시 Stripe
- 소스 관리: GitHub

이 구성은 코드 소유권, 개발 속도, 초기 비용, 향후 확장성의 균형이 좋다.

---

## 2. 조사 범위와 한계

‘AI 관련 서비스 모두’는 소규모 제품과 신규 출시 제품까지 포함하면 수천 개에 이르며 계속 변화한다. 이 문서는 실제 제품 개발 후보가 될 만한 대표 서비스와 주요 대안을 중심으로 시장 지도를 작성한 것이다.

가격과 무료 제공량은 자주 변경되므로 계약 또는 도입 직전에 각 서비스의 공식 가격 페이지를 다시 확인해야 한다. 특히 다음 비용을 구분해야 한다.

- 개발 도구 구독료
- 모델 입력·출력 토큰 비용
- 검색·이미지·음성·컴퓨터 조작 등의 도구 호출 비용
- 서버·데이터베이스·파일 저장 비용
- 자동화 실행 횟수 또는 크레딧 비용
- 관측 로그 저장 비용
- 결제 수수료

---

## 3. AI 코딩·개발 도구

| 서비스 | 유형 | 주요 강점 | 주의점 |
|---|---|---|---|
| OpenAI Codex | 코딩 에이전트 | 파일 수정, 터미널 실행, 테스트, 장기 작업 | 변경 사항 검토와 테스트 필요 |
| Claude Code | CLI 코딩 에이전트 | 대규모 코드 이해와 복잡한 리팩터링 | 사용량이 많으면 비용 증가 가능 |
| Cursor | AI 코드 편집기 | 자동완성, 에이전트, 다중 파일 수정 | 크레딧과 모델별 사용량 확인 필요 |
| GitHub Copilot | IDE·GitHub 보조 | 코드 제안, PR, 리뷰, GitHub 통합 | 복잡한 독립 작업에는 한계 가능 |
| Replit Agent | 클라우드 개발 | 설치 없이 개발부터 배포까지 지원 | 플랫폼 종속성과 사용량 비용 |
| Devin | 자율 개발 에이전트 | 티켓 단위 비동기 작업 | 높은 비용과 결과 검수 필요 |
| Gemini CLI·Jules | Google 계열 에이전트 | Gemini와 Google 생태계 연동 | 작업에 따른 성능 편차 |
| Amazon Q Developer·Kiro | AWS 계열 개발 도구 | AWS 및 기업 환경과 결합 | AWS 밖에서는 이점 감소 |
| Aider | 오픈소스 CLI | Git 기반 작업과 모델 선택 자유 | 환경 설정을 직접 관리 |
| Continue·Cline·Roo Code | 오픈소스 IDE 에이전트 | API와 모델을 직접 선택 | 운영과 보안을 직접 책임 |
| OpenHands | 오픈소스 개발 에이전트 | 자체 호스팅과 확장 가능 | 설치·유지관리 부담 |

GitHub Copilot은 자체 기능뿐 아니라 Codex와 Claude 같은 외부 코딩 에이전트 연결도 제공한다. 참고: [GitHub Copilot 요금제](https://github.com/features/copilot/plans), [GitHub 외부 코딩 에이전트 문서](https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents)

### 권장 판단

- 실제 제품 개발: Codex 중심
- 개발자가 편집기 안에서 직접 작업: Cursor 또는 Copilot
- 클라우드에서 빠르게 시연: Replit Agent
- 공급자 종속성을 최소화: Aider, Continue, Cline 계열

---

## 4. 프롬프트 기반 AI 앱 빌더

| 서비스 | 적합한 작업 | 확장성·코드 소유 관점 |
|---|---|---|
| Lovable | 웹 서비스 MVP, CRUD, Supabase 연동 | 비교적 양호 |
| Bolt.new | 브라우저 기반 풀스택 프로토타입 | 중간 |
| Vercel v0 | React·Next.js UI 생성 | 프론트엔드에 특히 유리 |
| Replit Agent | 개발·실행·배포 통합 | 플랫폼 의존 가능 |
| Base44 | 비개발자의 업무 앱 제작 | 플랫폼 의존 가능 |
| Firebase Studio | Firebase 기반 앱 | Google 생태계에 적합 |
| Bubble AI | 전통 노코드 앱과 AI 생성 | Bubble 종속성 큼 |
| FlutterFlow AI | 모바일 앱 | Flutter 코드 활용 가능 |
| Webflow AI·Wix AI | 홈페이지·콘텐츠 서비스 | 복잡한 AI 제품에는 제한적 |
| Framer AI | 랜딩 페이지·마케팅 사이트 | 백엔드 기능이 약함 |
| Hostinger Horizons | 간단한 웹앱·사이트 | 복잡한 확장에 불리 |

이 제품군은 시연용 MVP를 빠르게 만드는 데 적합하다. 인증, 결제, 세부 권한, 복잡한 데이터 구조와 장기 유지보수가 중요해지면 코드 기반 개발로 전환할 가능성이 높다. 참고: [AI 앱 빌더 비교](https://lovable.dev/guides/best-ai-app-builders)

### 권장 판단

- UI 아이디어 검증: v0
- 비개발자 중심 MVP: Lovable
- 개발과 배포를 한곳에서 해결: Replit Agent
- 장기 제품: 앱 빌더로 시안을 만든 뒤 Codex로 관리 가능한 코드베이스 구축

---

## 5. AI 모델 및 API 공급자

### 5.1 범용 모델

| 공급자 | 주요 성격 |
|---|---|
| OpenAI | 범용 추론, 코딩, 이미지, 음성, 웹·컴퓨터 도구 |
| Anthropic | 긴 문서, 코딩, 기업 업무 |
| Google Gemini | 긴 컨텍스트, 멀티모달, Google 생태계 |
| Mistral AI | 유럽권·기업용·자체 배포 선택지 |
| Cohere | 기업 검색, 임베딩, 재정렬, 보안 |
| xAI | Grok API |
| DeepSeek | 비용 효율적인 추론·코딩 모델 선택지 |
| Meta Llama | 오픈 웨이트와 자체 호스팅 |
| Qwen | 다국어·코딩 오픈 모델 |
| Amazon Nova | AWS Bedrock 중심 모델 |

### 5.2 모델 유통·호스팅

- Azure OpenAI
- AWS Bedrock
- Google Vertex AI
- Hugging Face
- OpenRouter
- Together AI
- Fireworks AI
- Groq
- Cerebras
- Replicate
- DeepInfra

OpenRouter는 여러 모델을 하나의 API 형태로 비교·연결할 때 편리하다. Azure OpenAI, Bedrock, Vertex AI는 기업용 클라우드 계약과 권한 관리가 중요한 경우 유리하다.

### 5.3 OpenAI 가격 기준

2026년 8월 11일 공식 문서에서 확인한 텍스트 API 가격은 다음과 같다.

| 모델 | 입력 100만 토큰 | 출력 100만 토큰 | 권장 용도 |
|---|---:|---:|---|
| GPT-5.6 Luna | $0.20 | $1.20 | 저비용·대량 처리 |
| GPT-5.6 Terra | $2 | $12 | 성능과 비용의 균형 |
| GPT-5.6 Sol | $5 | $30 | 복잡한 전문 작업 |
| GPT-5-Codex | $1.25 | $10 | 코딩 에이전트 작업 |

출처: [OpenAI 모델 및 가격](https://developers.openai.com/api/docs/models), [GPT-5-Codex 모델](https://developers.openai.com/api/docs/models/gpt-5-codex)

한 요청이 입력 5,000토큰과 출력 2,000토큰을 사용한다고 가정하면 모델 비용은 다음과 같다. 원화는 비교를 위한 예시로 1달러를 1,400원으로 가정했다.

| 모델 | 요청 1회 | 1,000회 |
|---|---:|---:|
| Luna | 약 3.4원 | 약 3,400원 |
| Terra | 약 47.6원 | 약 47,600원 |
| Sol | 약 119원 | 약 119,000원 |

실제 청구액에는 캐시 입력 할인, 추론 토큰, 웹 검색, 이미지, 음성 및 기타 도구 호출이 영향을 줄 수 있다.

### 5.4 국내·한국어 환경 후보

| 서비스 | 주요 활용 |
|---|---|
| NAVER Cloud CLOVA Studio·HyperCLOVA X | 한국어 모델과 국내 클라우드·기업 계약 |
| Upstage Solar | 한국어 LLM, 임베딩, 문서 처리 |
| Upstage Document Parse | PDF·표·문서 구조화 |
| Sendbird AI Agent | 고객상담 자동화와 사람 상담원 전환 |
| 뤼튼 | 소비자용 AI 포털·에이전트 서비스 |
| KT 믿음·LG EXAONE 등 | 국내 기업·자체 모델 적용 후보 |

참고: [CLOVA Studio](https://clovastudio.ncloud.com/), [Upstage 콘솔](https://console.upstage.ai/api-keys?api=document-parsing), [Sendbird AI Agent](https://sendbird.com/docs/ai-chatbot/platform-api/v3/managing-ai-chatbots/update-an-ai-chatbot), [뤼튼](https://wrtn.io/wrtn-technologies/)

### 권장 판단

초기에는 OpenAI를 기본 모델로 사용하되 애플리케이션 코드가 특정 모델에 강하게 종속되지 않도록 모델 호출 계층을 분리한다. 대량의 단순 작업은 저비용 모델로 보내고, 어려운 요청만 고성능 모델로 라우팅한다.

---

## 6. 노코드 AI 에이전트·챗봇 플랫폼

| 서비스 | 주요 특징 | 적합 대상 |
|---|---|---|
| Dify | 챗플로우, 에이전트, RAG, API, 자체 호스팅 | 범용 AI SaaS |
| Flowise | 시각적 AI 플로우, 오픈소스 | 개발자·프로토타입 |
| Langflow | Python 기반 시각적 플로우 | 실험·교육·백엔드 |
| Voiceflow | 대화·음성 봇 설계 | 고객 경험 |
| Botpress | 챗봇과 채널 연동 | 고객지원 |
| Microsoft Copilot Studio | Microsoft 365·Power Platform 연동 | 기업 내부 도구 |
| Vertex AI Agent Builder | Google Cloud 검색·에이전트 | 대기업 |
| Amazon Bedrock Agents | AWS 서비스·지식베이스 연동 | AWS 환경 |
| Salesforce Agentforce | CRM 기반 영업·상담 | Salesforce 고객 |
| ServiceNow AI Agents | ITSM·사내 프로세스 | 대기업 |
| IBM watsonx Orchestrate | 기업 프로세스와 거버넌스 | 규제 산업 |
| Relevance AI | AI 팀·멀티에이전트 | 영업·운영 |
| Lindy | 이메일·회의·업무 비서 | 소규모 팀 |
| Dust | 기업 지식 업무 에이전트 | 내부 업무 |
| Stack AI | 기업용 시각적 워크플로 | 보안·규제 조직 |
| Chatbase·DocsBot·CustomGPT.ai | 문서 기반 챗봇 | FAQ·고객지원 |
| Intercom Fin·Zendesk AI·Ada | 기존 CS에 AI 적용 | 고객지원 자동화 |

Dify는 RAG, 에이전트, 웹앱 공개와 관측 기능을 한 제품 안에서 제공하므로 범용 MVP에 적합하다. 참고: [Dify Cloud](https://dify.ai/pricing/dify-cloud)

---

## 7. 업무 자동화 플랫폼

| 서비스 | 주요 성격 | 추천 상황 |
|---|---|---|
| n8n | 개발자 친화적, 자체 호스팅, 복잡한 분기 | 제품 백엔드와 AI 자동화 |
| Make | 시각적 워크플로와 세밀한 로직 | 기술 담당자의 업무 자동화 |
| Zapier | 광범위한 앱 연결과 쉬운 사용 | 비개발자와 SaaS 연결 |
| Gumloop | AI 추론 중심 시각적 자동화 | 영업·마케팅·운영 |
| Pipedream | API·코드 중심 워크플로 | 개발자 통합 |
| Activepieces | 오픈소스 자동화 | 자체 호스팅 |
| Windmill | 스크립트·내부 도구·워크플로 | 개발 조직 |
| Temporal | 신뢰성이 중요한 장기 실행 | 대규모 백엔드 |
| Retool Workflows | 내부 관리도구와 자동화 | 운영팀 |
| Bardeen | 브라우저와 영업 자동화 | 개인·영업팀 |
| Relay.app | 사람 승인 중심 워크플로 | 검토가 필요한 자동화 |
| Workato·Tray.ai·MuleSoft | 기업용 시스템 통합 | 대기업 |

n8n은 자동화 중간에 사람의 승인을 넣을 수 있어 AI의 외부 행동을 통제하기 쉽다. 참고: [n8n AI](https://n8n.io/ai/), [Zapier 가격](https://zapier.com/pricing), [Make 가격](https://www.make.com/en/pricing)

---

## 8. AI 에이전트 개발 프레임워크

| 프레임워크 | 강점 | 도입 시점 |
|---|---|---|
| OpenAI Agents SDK | OpenAI 모델·도구와 간결한 구현 | OpenAI 중심 제품 초기 |
| LangChain | 넓은 통합 생태계 | 다양한 공급자 연결 |
| LangGraph | 상태, 승인, 재시도, 장기 실행 | 복잡한 에이전트 워크플로 |
| LlamaIndex | 문서, 검색, RAG | 지식 검색 중심 제품 |
| CrewAI | 역할 기반 멀티에이전트 | 역할 분리가 실제로 필요할 때 |
| Microsoft Agent Framework | Azure·Microsoft 환경 | Microsoft 기업 환경 |
| Google ADK | Gemini·Google Cloud | Google 중심 제품 |
| AWS Strands Agents | AWS 서비스 통합 | AWS 중심 제품 |
| PydanticAI | Python 타입 안정성 | Python 백엔드 |
| Mastra | TypeScript 에이전트·워크플로 | TypeScript 제품 |
| Vercel AI SDK | 웹 스트리밍·다중 모델 UI | Next.js 웹앱 |
| DSPy | 프롬프트·파이프라인 최적화 | 평가 데이터 확보 후 |
| Haystack | 검색·RAG 파이프라인 | 검색 중심 서비스 |

LangGraph는 상태가 있는 장기 실행, LlamaIndex는 RAG, CrewAI는 역할 기반 멀티에이전트에 강점이 있다. 참고: [AWS 에이전트 프레임워크 비교](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-frameworks/comparing-agentic-ai-frameworks.html), [LangChain 제품 개념](https://docs.langchain.com/oss/python/concepts/products)

### 도입 원칙

초기에는 OpenAI SDK 또는 Vercel AI SDK 같은 얇은 계층으로 시작한다. 승인·재시도·중단 후 복구·장기 실행 같은 요구가 명확해질 때 LangGraph 등의 워크플로 프레임워크를 추가한다. 단순 작업에 멀티에이전트를 적용하면 비용과 오류 지점만 증가할 수 있다.

---

## 9. 데이터베이스·RAG·검색

### 9.1 애플리케이션 데이터베이스

- Supabase: PostgreSQL, 인증, 저장소, 실시간 기능, pgvector
- Firebase: Google 기반 인증·DB·호스팅
- Neon: 서버리스 PostgreSQL
- PlanetScale: 관리형 관계형 DB
- MongoDB Atlas: 문서 DB와 벡터 검색
- Cloudflare D1: 엣지 SQLite
- Convex: 실시간 애플리케이션 백엔드

### 9.2 벡터 DB·검색

| 서비스 | 특징 | 추천 단계 |
|---|---|---|
| pgvector | 기존 PostgreSQL에서 벡터 검색 | 초기 제품 |
| Pinecone | 관리가 쉬운 서버리스 벡터 DB | 검색량 증가 후 |
| Weaviate | 하이브리드 검색·자체 호스팅 | 검색 기능이 핵심일 때 |
| Qdrant | 빠른 오픈소스 벡터 DB | 자체 운영 또는 전용 검색 |
| Milvus·Zilliz | 대규모 벡터 처리 | 대규모 데이터 |
| Chroma | 로컬·프로토타입 | 실험 |
| Elasticsearch·OpenSearch | 키워드와 벡터 검색 결합 | 기존 검색 인프라가 있을 때 |
| Redis | 캐시와 벡터 검색 | 실시간·캐시 중심 |
| Typesense·Meilisearch | 일반 앱 검색 | 상품·콘텐츠 검색 |

초기에는 Supabase PostgreSQL과 pgvector로 충분할 가능성이 높다. 데이터와 검색량이 커진 뒤 전문 벡터 DB로 분리한다. 참고: [Pinecone 가격](https://www.pinecone.io/pricing/), [Weaviate 가격](https://weaviate.io/pricing)

---

## 10. 배포·관측·보안·결제

### 10.1 배포

- Vercel: Next.js와 AI 스트리밍
- Cloudflare Workers: 엣지 실행
- Railway·Render·Fly.io: 백엔드와 컨테이너
- AWS·Google Cloud·Azure: 기업·대규모 시스템
- Modal·Runpod·Replicate: GPU 및 AI 작업
- Hugging Face Spaces: AI 데모
- Streamlit·Gradio: 내부 도구와 프로토타입

### 10.2 AI 관측과 평가

- LangSmith
- Langfuse
- Helicone
- Arize Phoenix
- Weights & Biases Weave
- Braintrust
- Humanloop
- PromptLayer
- OpenAI Evals
- Galileo

반드시 기록할 지표는 다음과 같다.

- 모델별 입력·출력 토큰과 비용
- 응답 시간과 오류율
- 사용자별·기능별 사용량
- 검색 결과와 근거 문서
- 도구 호출 성공·실패
- 사용자 평가와 재시도율
- 프롬프트·모델 버전
- 개인정보와 비밀정보 노출 여부

### 10.3 인증·결제·제품 분석

| 영역 | 주요 서비스 |
|---|---|
| 인증 | Clerk, Auth0, Supabase Auth, Firebase Auth |
| 해외 결제 | Stripe, Lemon Squeezy, Paddle |
| 국내 결제 | 토스페이먼츠, 포트원 |
| 제품 분석 | PostHog, Mixpanel, Amplitude |
| 오류 추적 | Sentry |
| 비밀키 관리 | Doppler, Infisical, 클라우드 Secret Manager |
| AI 보안 | Lakera, Protect AI, HiddenLayer, Guardrails AI |

---

## 11. 구축 경로 비교

### 경로 A: 빠른 MVP

- Lovable 또는 v0
- Supabase
- OpenAI API
- Vercel
- 토스페이먼츠 또는 Stripe
- PostHog

**장점:** 1~2주 안에 사용자 반응을 확인하기 쉽다.  
**위험:** 복잡한 기능이 추가되면 생성된 코드와 구조를 정리해야 한다.

### 경로 B: 유지보수 가능한 제품형 — 권장

- Codex
- Next.js 또는 React + FastAPI
- OpenAI Responses API
- Supabase PostgreSQL + pgvector
- n8n
- Vercel + Railway 또는 Cloudflare
- Langfuse
- Sentry
- 토스페이먼츠·포트원
- GitHub

**장점:** 개발 속도, 코드 소유권, 비용, 확장성의 균형이 좋다.  
**위험:** 최소한의 소프트웨어 설계와 운영 지식이 필요하다.

### 경로 C: 기업·보안형

- Azure OpenAI 또는 AWS Bedrock
- Microsoft Agent Framework 또는 LangGraph
- Azure AI Search, OpenSearch 또는 Pinecone
- 기업 SSO
- 감사 로그와 사람 승인 절차
- 전용 클라우드·기업 계약

**장점:** 권한, 감사, 규정 준수에 유리하다.  
**위험:** 구축비와 운영 복잡도가 높다.

---

## 12. 권장 아키텍처

```text
사용자
  │
  ▼
웹·모바일 UI
  │
  ▼
애플리케이션 API
  ├── 인증·사용자 설정 ── Supabase
  ├── AI 요청 라우터
  │     ├── 단순 작업 ── 저비용 모델
  │     └── 복잡한 작업 ── 고성능 모델
  ├── 사용자 문서 검색 ── PostgreSQL + pgvector
  ├── 외부 업무 실행 ── n8n
  └── 결제·사용량 제한 ── 포트원/토스페이먼츠
        │
        ├── AI 로그·평가 ── Langfuse
        ├── 오류 추적 ── Sentry
        └── 제품 분석 ── PostHog
```

### 설계 원칙

1. 사용자별 데이터와 프롬프트를 분리한다.
2. 모델 공급자를 교체할 수 있도록 AI 호출 코드를 추상화한다.
3. 단순 요청과 복잡한 요청에 서로 다른 모델을 사용한다.
4. AI가 외부 시스템을 변경하기 전에는 승인과 권한을 확인한다.
5. 사용량 제한과 예산 상한을 애플리케이션에 내장한다.
6. 중요한 답변은 근거 문서와 함께 저장한다.
7. 프롬프트와 모델 버전을 기록해 결과를 재현할 수 있게 한다.

---

## 13. 비용 구조와 절감 전략

### 주요 비용 항목

| 비용 | 초기 단계 | 성장 단계의 위험 |
|---|---|---|
| Codex·개발 도구 | 구독료 중심 | 팀 좌석과 추가 크레딧 |
| 모델 API | 비교적 낮음 | 사용자 증가와 긴 답변 |
| 서버·DB | 무료·저가 구간 가능 | 트래픽·저장량·백업 |
| RAG | pgvector로 시작 가능 | 임베딩 갱신과 검색량 |
| 자동화 | 소규모 무료·저가 | 실행 횟수 증가 |
| 로그·관측 | 무료 구간 가능 | 원문·트레이스 저장량 |
| 외부 API | 서비스별 상이 | 검색·지도·문서·음성 비용 |
| 결제 | 거래 수수료 | 환불·해외 결제·세금 처리 |

### 비용 절감 우선순위

1. 모든 요청에 최고급 모델을 사용하지 않는다.
2. 출력 길이를 제한한다.
3. 반복되는 시스템 프롬프트와 문서는 캐싱한다.
4. 전체 대화 대신 필요한 최근 내용과 요약만 전달한다.
5. RAG 검색 결과 수와 문서 길이를 제한한다.
6. 실패한 에이전트의 무한 반복을 방지한다.
7. 사용자별 일·월 사용량 한도를 둔다.
8. 관리자 화면에서 기능별 원가를 확인한다.

---

## 14. 최종 권고안

현재 단계에서는 다음 6개를 핵심으로 채택하는 것이 적절하다.

1. **Codex** — 개발과 유지보수
2. **OpenAI API** — 기본 AI 모델
3. **Supabase** — 데이터베이스·인증·초기 RAG
4. **Vercel + Railway 또는 Cloudflare** — 배포
5. **n8n** — 외부 서비스와 업무 자동화
6. **Langfuse + Sentry** — AI 품질·비용·오류 관측

프롬프트 기반 앱 빌더는 아이디어와 UI 검증에 사용하고, 핵심 제품은 GitHub에 보존되는 일반 코드로 구축한다. RAG는 사용자 문서가 실제 제품 가치의 중심일 때 추가하며, 멀티에이전트는 단일 에이전트로 해결되지 않는 문제가 확인된 뒤 도입한다.

---

## 15. 제품 기획 전에 결정할 질문

다음 질문의 답이 정해지면 서비스별 예상 비용과 구체적인 기술 설계를 계산할 수 있다.

1. 주요 사용자는 개인, 팀, 기업 중 누구인가?
2. 사용자가 AI에게 맡길 핵심 작업은 무엇인가?
3. AI가 답변만 하는가, 실제 외부 서비스에서 행동도 하는가?
4. 사용자의 문서·이메일·일정·업무 데이터에 연결해야 하는가?
5. 웹, 모바일, 데스크톱 중 어떤 형태가 필요한가?
6. 한 사용자가 하루에 몇 번 사용할 것으로 예상하는가?
7. 무료, 구독제, 사용량제 중 어떤 수익 모델을 적용할 것인가?
8. 개인정보·의료·금융·기업 기밀 등 민감 정보가 포함되는가?
9. 한국 사용자만 대상으로 하는가, 해외도 포함하는가?
10. 첫 MVP에서 반드시 작동해야 하는 기능 세 가지는 무엇인가?

이 질문을 기준으로 다음 단계에서는 후보 서비스 점수표, 사용자 1인당 원가, 월별 인프라 예산, MVP 개발 일정을 작성한다.
