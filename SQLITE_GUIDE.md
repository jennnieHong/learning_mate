# 🗄️ LearningMate 데이터 저장 및 스토리지 가이드

LearningMate는 사용자 데이터를 보호하고 원활한 성능을 제공하기 위해 브라우저 기반의 최신 저장소 기술을 사용합니다.

---

## 1. 현재 주 저장소: IndexedDB (Phase 1)

현재 버전의 LearningMate는 브라우저 내장 데이터베이스인 **IndexedDB**를 사용하여 모든 데이터를 관리합니다.

### 특징
- **No-Server**: 서버 없이 로컬에서 완벽하게 작동합니다.
- **High Capacity**: `localStorage`(5MB)와 달리 수백 MB 이상의 대용량 데이터를 저장할 수 있습니다.
- **Asynchronous**: 비동기 처리를 통해 대용량 문제집을 읽고 쓸 때도 UI가 끊기지 않습니다.

### 데이터베이스 구조 (localforage 사용)
1. **`learningmate-files`**: 업로드된 파일의 메타데이터 (ID, 파일명, 타입, 생성일 등)
2. **`learningmate-problems`**: 실제 문제 데이터 (질문, 정답, 선택지 리스트 등)
3. **`learningmate-progress`**: 사용자 학습 데이터 (완료 여부, 정답 여부, 누적 오답 횟수 등)
4. **`learningmate-settings`**: 사용자 인터페이스 및 학습 환경 설정

---

## 2. 데이터 확인 및 디버깅 방법

개발자 도구(`F12`)를 활용하여 저장된 데이터를 직접 확인할 수 있습니다.

1. **Application** 탭 선택 (또는 '애플리케이션')
2. 좌측 메뉴의 **Storage** -> **IndexedDB** 클릭
3. `learningmate-*`로 시작하는 DB 인스턴스들을 선택하여 저장된 레코드 확인 가능

---

## 3. 백엔드 연동 가이드 (Phase 2 - 예정)

클라우드 동기화 또는 멀티 디바이스 지원이 필요한 경우, 로컬 데이터를 서버 DB로 확장할 수 있습니다.

### SQLite 연동 (Legacy/Backend 옵션)
이전 버전에서 사용되었던 SQLite는 백엔드 서버(`/backend`) 실행 시 메뉴 관리 등에 사용됩니다.
- **DB 위치**: `backend/database/learningmate.db`
- **초기화**: `node scripts/initDb.js`
- **관리 도구**: `SQLite Viewer` 확장을 통해 시각적 확인 가능

### PostgreSQL 확장 전략
실제 상용 서비스나 대규모 멀티 유저 환경에서는 **PostgreSQL**로의 전환을 권장합니다.
- **이유**: 동시성 제어, 트랜잭션 수립, 보안성 및 클라우드 호스팅 용이성.

---

## 4. 데이터 안전 수칙

- **브라우저 캐시 삭제 주의**: '사이트 데이터 삭제' 선택 시 IndexedDB의 모든 정보가 삭제될 수 있습니다.
- **백업**: 중요한 문제집은 원본 파일(Excel, CSV)을 별도로 보관하는 것을 권장합니다.

---
Created by LearningMate Team.
