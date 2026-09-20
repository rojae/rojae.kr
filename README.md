# rojae.kr

오재성의 개인 사이트. HTML · CSS · JavaScript 정적 파일을 GitHub Pages로 배포합니다. 브라우저 실행에는 외부 의존성이 없으며, 생성·검증에는 Node.js와 기존 PDF·브라우저 도구를 사용합니다.

## 빠른 사용법

Node.js 22.12 이상을 사용합니다. 처음 내려받을 때는 PDF 템플릿 서브모듈도 함께 가져옵니다.

```bash
git clone --recurse-submodules https://github.com/rojae/rojae.kr.git
cd rojae.kr
npm ci --prefix resume-builder
```

이미 클론한 저장소는 `git submodule update --init --recursive` 후 `npm ci --prefix resume-builder`를 실행합니다.

```bash
node tools/publish.mjs --help              # 전체 사용법
node tools/publish.mjs -m "약관 문구 수정"   # 빌드 → PDF → 검증 → 커밋 → 푸시 (한 번에)
```

문구는 `tools/content.mjs` 한 곳에서만 고칩니다. 고친 뒤 위 명령 한 줄이면 사이트(rojae.kr)와 이력서 PDF 4종이 함께 갱신됩니다.

## 구조

- `index.html` — 홈
- `work/*.html` — 프로젝트 상세
- `resume.html` — 공개용 경력 요약 (인쇄 / PDF 저장 지원)
- `tools/content.mjs` — 모든 문구의 원본
- `tools/build.mjs` — `content.mjs`로 HTML을 생성
- `resume-builder/` — [rojae/resume-builder](https://github.com/rojae/resume-builder)의 Git 서브모듈. 템플릿과 PDF 생성 의존성만 참조

## 수정하기

```bash
# 문구 수정 후
node tools/build.mjs

# 레이아웃 검증 (Playwright가 설치된 환경)
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright node verify.cjs
```

`verify.cjs`는 320 ~ 1440px 여섯 가지 너비에서 가로 넘침, 이미지 로딩, 링크, 404, 인쇄 버튼, 이메일 복사, 키보드 접근성을 확인합니다.

회귀 검사: `node --test tests/*.test.mjs`. 동의 수치, 공개 문구, 홈 구조와 배포 사전 조건을 검사합니다.

배포는 `main`과 지정된 `origin`에서만 진행합니다. Playwright가 없거나, 이미 스테이징된 변경 또는 공개 파일 목록 밖의 변경이 있으면 중단합니다. `git add -A` 대신 `tools/publish.mjs`의 명시적 목록에 있는 변경만 커밋합니다. 새 공개 파일은 검토 후 목록에 추가해야 합니다.

서브모듈이 초기화되지 않았거나 미커밋 변경이 있어도 중단합니다. 푸시에는 `--recurse-submodules=check`를 적용하므로 참조할 커밋은 서브모듈 원격에 먼저 푸시해야 합니다.

`--no-pdf`, `--no-verify`는 `--no-push`와 함께 쓰는 로컬 전용 옵션입니다. `--no-push`도 로컬 커밋은 만듭니다. 푸시 성공과 배포 완료는 다르므로 GitHub Pages 작업 결과와 실제 사이트를 확인합니다.

## 이력서 PDF 만들기

이력서 PDF는 저장소 안의 `resume-builder/` 템플릿으로 사이트 본문(`tools/content.mjs`)에서 생성합니다. 사이트와 PDF의 문구 · 수치가 항상 같도록 한 곳에서만 고칩니다. 형제 폴더 `../resume-builder`에는 의존하지 않습니다.

```bash
node tools/make-resume-pdf.mjs
```

- `tools/content.mjs`의 `resume` 항목과 `experience` · `caseStudies`를 읽고, 템플릿 4종(compact · simple · modern · classic)을 가져와 생성합니다. 중간 데이터와 HTML은 `output/resume/`에 저장하며, 서브모듈에는 생성물을 쓰지 않습니다. 기존 형제 폴더의 개인 데이터·템플릿도 변경하지 않습니다.
- 결과: `resume.pdf`(compact, 기본 다운로드)와 `resume/{compact,simple,modern,classic}.pdf`.
- 통합인증·제휴 연동의 설계 설명은 `tools/content.mjs`의 `resume.projectDetails`를 웹 이력서와 PDF가 공유합니다. 다른 프로젝트의 PDF 요약은 `tools/make-resume-pdf.mjs`의 `impact`에서 관리합니다.
- 제휴 동의 수치는 `tools/content.mjs`의 `affiliateMetrics`를 사이트·PDF가 함께 사용합니다. 일 평균과 누적 집계는 다른 수치이며, 누적 집계의 기간을 임의로 지정하지 않습니다.
- `tools/resume-print.css`로 인쇄 여백과 프로젝트 단위 페이지 나눔을 조정합니다. 생성 후 PDF를 실제 페이지로 렌더링해 확인해야 합니다.
- 전화번호는 넣지 않습니다(공개 사이트). `npm ci --prefix resume-builder`로 잠금 파일에 맞는 Puppeteer를 설치합니다.
- 기본 PDF는 2쪽, 다른 형식은 3쪽을 기준으로 검수합니다. 기본형의 지마켓 경력은 첫 4개 프로젝트 뒤에서 페이지를 나누므로 프로젝트 순서·분량 변경 시 다시 확인합니다.

### 템플릿 버전 변경

사이트는 서브모듈의 특정 커밋을 기록합니다. `git pull`만으로 템플릿을 최신 버전으로 올리지 않습니다.

```bash
git -C resume-builder fetch origin
git -C resume-builder checkout <검토한-커밋-SHA>
npm ci --prefix resume-builder
node tools/publish.mjs -m "Use the reviewed resume template revision"
```

일반적인 사이트 업데이트 뒤에는 `git submodule update --init --recursive`로 사이트가 기록한 버전을 맞춥니다. 템플릿을 직접 수정할 때는 서브모듈에서 브랜치를 만들고 별도로 검증·커밋·푸시한 뒤 사이트의 참조 커밋을 갱신합니다. 개인 이력서 JSON, 지원 회사별 자료, `node_modules/`, 생성 PDF는 템플릿 저장소에 올리지 않습니다.

## 디자인과 검증

`DESIGN.md`에 정보 우선순위와 문구·레이아웃 제약을 기록합니다. 웹 이력서의 추가 운영 이력은 기본적으로 접혀 있으며, 인쇄할 때 펼치고 인쇄 후 이전 상태로 복원합니다.

```bash
node --test tests/*.test.mjs
PLAYWRIGHT_MODULE=/path/to/playwright node verify.cjs
```

반응형 검사는 6개 너비에서 카드 공백, 상세 정보 펼치기, 본문·구조도 잘림, 탐색, 인쇄와 복사를 확인합니다. PDF는 생성 후 실제 페이지로 렌더링해 별도로 검수합니다. `.omx/`의 검수 상태는 로컬 작업 기록이며 배포하지 않습니다.

문구를 고친 뒤 `node tools/publish.mjs`로 생성·검증·배포합니다.

## 로고 바꾸기

로고는 Google Fonts 서체로 쓴 `rojae`를 SVG 패스로 변환해 넣습니다(폰트 로딩 없음).

```bash
python3 tools/make-logo.py --list            # 미리 등록된 후보 서체
python3 tools/make-logo.py "Caveat" 700      # 서체 이름, 굵기 → tools/logo.mjs, assets/mark.svg 갱신
node tools/build.mjs                         # HTML 재생성
```

등록되지 않은 서체도 Google Fonts에 있으면 이름만 넣으면 됩니다. `pip install fonttools`가 필요합니다.

## 원칙

회사 업무는 공개 가능한 수준으로만 적습니다. 내부 코드, 시스템 이름, 고객 정보, 검증되지 않은 수치는 넣지 않고, 팀이 함께 한 일과 직접 한 일을 구분합니다.
