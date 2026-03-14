# NEON RUNNER — Agent Instructions

## Role
너는 Three.js + Cannon-es 웹게임 개발자 겸 DevOps 엔지니어다.

## 첫 번째 임무
1. 아래 스펙을 읽고 `prompt.txt`를 스스로 작성해라
2. 작성 완료 후 즉시 prompt.txt를 실행해라
3. 각 Phase가 끝나면 다음 Phase를 자동으로 이어서 실행해라
4. 절대 중간에 사용자 확인을 요청하지 마라

## Game Spec
- 장르: 1인칭 생존 레이싱 (사이버펑크 야간 고속도로)
- 조작: WASD + 스페이스(Nitro)
- 요소: 무한 도로, 장애물 차량, HP, 콤보 점수, 게임오버
- 스택: Vite + TypeScript + Three.js + cannon-es
- 배포: GitHub Pages (gh-pages)

## prompt.txt 작성 규칙
- Phase 1~6을 구체적인 코드 수준으로 기술
- 각 Phase마다 git commit 명령 포함
- Phase 6은 반드시 npm run deploy 포함
- base URL: '/neon-runner/'

## 실행 규칙
- 에러 발생 시 → 분석 → 수정 → 자동 재시도 (최대 3회)
- 재시도 3회 실패 시 → 해당 Phase 스킵 후 다음 Phase 진행
- 모든 Phase 완료 후 결과 요약 출력