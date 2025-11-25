# Lens Cap Holder Generator

카메라 렌즈 캡 홀더를 위한 STL 파일 생성기입니다. 서버 사이드 렌더링과 Stripe 결제 통합을 지원합니다.

렌즈 캡 크기를 선택하고 스트랩 너비를 설정한 후, 무료로 프리뷰하거나 고품질 STL 파일을 $1.50에 구매할 수 있습니다.

렌즈 캡 크기는 렌즈의 필터 크기와 일치합니다.\
예) Nikon AF-S NIKKOR 50mm f/1.8G의 필터 크기가 58mm이면, 렌즈 캡도 58mm입니다.

## 주요 기능

- **무료 프리뷰**: 저해상도 렌더링으로 무료 프리뷰 제공
- **안전한 결제**: Stripe 통합으로 안전한 STL 파일 구매 ($1.50)
- **이메일 전송**: 결제 완료 후 STL 파일 자동 이메일 전송
- **서버 사이드 렌더링**: SCAD 코드가 서버에서만 생성되어 보호됨
- **Docker 지원**: Docker 컨테이너로 간편하게 실행

## 빠른 시작

### Docker 사용 (권장)

1. **환경 변수 파일 생성**

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
PORT=3000
FRONTEND_URL=http://localhost:3000

# Stripe 설정
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# 이메일 설정 (Gmail 예시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

2. **Docker Compose로 실행**

```bash
docker-compose up -d
```

3. **브라우저에서 접속**

```
http://localhost:3000
```

### 수동 설치 (Docker 없이)

1. **필수 소프트웨어 설치**
   - Node.js (v18 이상)
   - OpenSCAD (서버에 설치되어 있어야 함)

2. **의존성 설치**

```bash
npm install
```

3. **환경 변수 설정**

`.env` 파일을 생성하고 위의 환경 변수를 설정하세요.

4. **서버 실행**

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

## 상세 설정

### Stripe 설정

1. **Stripe 계정 생성**
   - [Stripe](https://stripe.com)에서 계정 생성
   - 테스트 모드에서 시작 (나중에 라이브 모드로 전환 가능)

2. **API 키 발급**
   - Stripe Dashboard → Developers → API keys
   - Secret key 복사 → `.env`의 `STRIPE_SECRET_KEY`에 입력
   - 테스트 모드: `sk_test_...`로 시작
   - 라이브 모드: `sk_live_...`로 시작

3. **웹훅 설정** (이메일 전송을 위해 필수)
   - Stripe Dashboard → Developers → Webhooks
   - "Add endpoint" 클릭
   - Endpoint URL: `https://yourdomain.com/api/webhook`
   - 로컬 테스트: [Stripe CLI](https://stripe.com/docs/stripe-cli) 사용
   - 이벤트 선택: `checkout.session.completed`
   - 웹훅 시크릿 복사 → `.env`의 `STRIPE_WEBHOOK_SECRET`에 입력

### 이메일 설정

#### Gmail 사용 시

1. **앱 비밀번호 생성**
   - Google 계정 → 보안 → 2단계 인증 활성화
   - 앱 비밀번호 생성: [Google 계정 관리](https://myaccount.google.com/apppasswords)
   - 생성된 16자리 비밀번호를 `.env`의 `SMTP_PASSWORD`에 입력

2. **`.env` 설정 예시**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_digit_app_password
   SMTP_FROM=your_email@gmail.com
   ```

#### 다른 이메일 서비스

- **SendGrid**: `smtp.sendgrid.net`, 포트 587
- **Mailgun**: `smtp.mailgun.org`, 포트 587
- **Outlook**: `smtp-mail.outlook.com`, 포트 587

각 서비스의 SMTP 설정에 맞게 `.env`를 수정하세요.

## 사용 방법

1. **렌즈 크기 선택**
   - "All filter sizes of your lenses"에서 렌즈 캡 크기 선택
   - 여러 개 선택 가능
   - 직접 입력도 가능 (예: 50mm)

2. **스트랩 너비 설정**
   - "Strap Width (mm)"에 스트랩 너비 입력 (기본값: 11mm)

3. **프리뷰 (무료)**
   - "Preview (Free)" 버튼 클릭
   - 저해상도 STL 파일이 생성되어 3D 뷰어에 표시됨

4. **STL 파일 구매 ($1.50)**
   - 이메일 주소 입력
   - "Download STL ($1.50)" 버튼 클릭
   - Stripe 결제 페이지로 이동
   - 결제 완료 후 STL 파일 자동 다운로드 및 이메일 전송

## Docker 명령어

```bash
# 이미지 빌드
docker build -t lens-cap-generator .

# 컨테이너 실행
docker run -d \
  --name lens-cap \
  -p 3000:3000 \
  --env-file .env \
  lens-cap-generator

# 로그 확인
docker logs -f lens-cap

# 컨테이너 중지
docker stop lens-cap

# 컨테이너 삭제
docker rm lens-cap
```

## API 엔드포인트

- `POST /api/preview` - 무료 프리뷰 STL 생성 (저해상도)
- `POST /api/create-checkout` - Stripe 결제 세션 생성
- `GET /api/download-stl/:sessionId` - 결제 후 STL 다운로드
- `POST /api/webhook` - Stripe 웹훅 핸들러 (이메일 전송)

## 파일 구조

```
lens-cap/
├── server.js          # Express 서버
├── template.scad       # SCAD 템플릿 파일
├── index.html         # 프론트엔드 HTML
├── script.js          # 클라이언트 JavaScript
├── style.css          # 스타일시트
├── Dockerfile         # Docker 이미지 정의
├── docker-compose.yml # Docker Compose 설정
├── package.json       # Node.js 의존성
└── .env              # 환경 변수 (생성 필요)
```

## 배포 시 주의사항

### 프로덕션 환경 변수
- `STRIPE_SECRET_KEY`: 라이브 모드 키 사용 (`sk_live_...`)
- `FRONTEND_URL`: 실제 도메인 URL
- `STRIPE_WEBHOOK_SECRET`: 프로덕션 웹훅 시크릿

### OpenSCAD 서버 설치 (Docker 없이 배포 시)
- Linux: `sudo apt-get install openscad` (Ubuntu/Debian)
- macOS: `brew install openscad`
- Windows: [공식 설치 프로그램](https://openscad.org/downloads.html)

### 환경 변수 보안
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 이미 포함되어 있습니다
- 배포 플랫폼(Vercel, Heroku, AWS 등)의 환경 변수 설정 사용

## 테스트

### 로컬 테스트 (Stripe CLI 사용)

```bash
# Stripe CLI 설치
# macOS: brew install stripe/stripe-cli/stripe
# 다른 OS: https://stripe.com/docs/stripe-cli

# 웹훅 포워딩
stripe listen --forward-to localhost:3000/api/webhook
```

### 테스트 카드 번호
- 성공: `4242 4242 4242 4242`
- 실패: `4000 0000 0000 0002`
- 만료일: 미래 날짜
- CVC: 임의의 3자리 숫자

## 문제 해결

### OpenSCAD를 찾을 수 없음
- Docker 사용 시: Dockerfile에 이미 포함되어 있음
- 직접 설치 시: OpenSCAD가 PATH에 있는지 확인
  - Mac/Linux: `which openscad`
  - Windows: OpenSCAD 설치 경로를 PATH에 추가

### 이메일 전송 실패
- SMTP 설정 확인
- Gmail: 앱 비밀번호 사용 확인
- 방화벽/보안 설정 확인

### Stripe 웹훅 오류
- 웹훅 시크릿 확인
- 로컬 테스트: Stripe CLI 사용
- 프로덕션: HTTPS 필수

## 보안

- SCAD 코드는 클라이언트에 노출되지 않음
- 모든 렌더링은 서버 사이드에서 수행
- Stripe가 모든 결제 처리
- 웹훅 시그니처 검증으로 보안 강화

## 라이선스

MIT
