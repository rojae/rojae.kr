# rojae.kr

오재성의 개인 사이트. 빌드 도구나 외부 의존성 없이 HTML · CSS · JavaScript로만 구성했고, GitHub Pages로 배포합니다.

## 구조

- `index.html` — 홈
- `work/*.html` — 프로젝트 상세
- `resume.html` — 공개용 경력 요약 (인쇄 / PDF 저장 지원)
- `tools/content.mjs` — 모든 문구의 원본
- `tools/build.mjs` — `content.mjs`로 HTML을 생성

## 수정하기

```bash
# 문구 수정 후
node tools/build.mjs

# 레이아웃 검증 (Playwright가 설치된 환경)
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright node verify.cjs
```

`verify.cjs`는 320 ~ 1440px 여섯 가지 너비에서 가로 넘침, 이미지 로딩, 링크, 404, 인쇄 버튼, 이메일 복사, 키보드 접근성을 확인합니다.

## 원칙

회사 업무는 공개 가능한 수준으로만 적습니다. 내부 코드, 시스템 이름, 고객 정보, 검증되지 않은 수치는 넣지 않고, 팀이 함께 한 일과 직접 한 일을 구분합니다.
