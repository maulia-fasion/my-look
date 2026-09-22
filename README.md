# MY LOOK — 독립형 GitHub Pages 버전

Claude Artifact 전용 기능을 제거하고 일반 브라우저/GitHub Pages에서 동작하도록 만든 1차 버전입니다.

## 포함 기능
- GPS 현재 위치 기반 실시간 날씨 조회
- Open-Meteo Forecast API 사용
- 지역명으로 날씨 조회
- 현재 기온 / 체감온도 / 강수확률 / 강수량 / 바람 / 습도 표시
- 날씨를 고려한 기본 코디 추천
- 옷 사진 촬영/선택
- 옷장 데이터와 사진을 IndexedDB에 로컬 저장
- 코디 기록 저장
- 데이터 JSON 백업/복원
- PWA 홈 화면 설치 지원
- GitHub Pages에서 정적 파일만으로 실행

## 중요한 저장 방식
이 버전은 서버 데이터베이스를 사용하지 않습니다. 옷 사진과 옷장/코디 기록은 **현재 사용하는 브라우저의 기기 저장공간**에 저장됩니다. 따라서 휴대폰과 PC 사이에서 자동 동기화되지 않습니다. 설정의 "내 데이터 내보내기/가져오기"를 이용해 백업할 수 있습니다.

## 날씨 API
Open-Meteo의 공개 Forecast API와 Geocoding API를 사용합니다. API 키를 코드에 넣지 않습니다.

- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/geocoding-api

## GitHub Pages
1. GitHub에서 `my-look` 저장소를 생성합니다.
2. 이 폴더의 파일을 저장소 루트에 업로드합니다.
3. Settings → Pages → Deploy from a branch → `main` / `/ (root)`를 선택합니다.
4. 생성된 `https://사용자이름.github.io/my-look/` 주소를 스마트폰에서 엽니다.
5. 브라우저의 "홈 화면에 추가"로 MY LOOK 아이콘을 설치합니다.

## 위치 권한
GPS 날씨 조회는 브라우저의 위치 권한을 필요로 합니다. GitHub Pages의 HTTPS 환경에서 실행하는 것을 권장합니다.

## 다음 단계 후보
- Supabase 계정 기반 동기화
- AI 사진 자동 의류 분류
- 사용자 선호 스타일 학습
- 시간대별/내일 날씨 기반 코디
- 미세먼지/자외선 정보 추가
