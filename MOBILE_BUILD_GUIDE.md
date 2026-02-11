# 📱 안드로이드 APK 빌드 가이드 (Mobile Build Guide)

이 문서는 수정된 소스 코드를 안드로이드 앱(APK)에 반영하기 위한 빌드 절차를 설명합니다. 
특히, 최신 Capacitor CLI 실행을 위해 프로젝트 내에 준비된 **Node 22** 버전을 사용하는 방법을 포함합니다.

---

## 🚀 빌드 순서 (Step-by-Step)

모든 작업은 터미널(PowerShell 또는 CMD)에서 진행하며, 기본 경로는 `frontend` 폴더입니다.

### 1단계: 웹 소스 빌드 (Web Build)
수정된 React 소스 코드를 배포용 파일로 변환합니다.
```powershell
cd frontend
npm run build
```

### 2단계: 안드로이드 프로젝트 동기화 (Capacitor Sync)
빌드된 웹 파일을 안드로이드 플랫폼 폴더로 복사합니다. **Node 22** 버전의 절대 경로를 사용해야 합니다.

> [!IMPORTANT]
> 아래 명령어를 복사하여 `frontend` 폴더 경로에서 실행하세요.

```powershell
& "d:\workspace\learningMate\frontend\node-v22-extracted\node-v22.14.0-win-x64\node.exe" node_modules\@capacitor\cli\bin\capacitor sync
```

### 3단계: APK 파일 생성 (Generate APK)
실제 안드로이드 앱 파일을 생성합니다. (두 가지 방법 중 선택)

#### 방법 A: 터미널에서 실행
```powershell
cd android
./gradlew assembleDebug
```

#### 방법 B: 안드로이드 스튜디오 활용 (추천)
1. Android Studio에서 `frontend/android` 프로젝트를 엽니다.
2. 상단 메뉴에서 **Build > Clean Project**를 클릭합니다. (권장)
3. 상단 메뉴에서 **Build > Build APK(s)** 또는 초록색 재생 버튼(**Run 'app'**)을 클릭합니다.

---

## 📂 생성된 APK 파일 위치

빌드가 완료되면 아래 경로에서 APK 파일을 찾을 수 있습니다:
`d:\workspace\learningMate\frontend\android\app\build\outputs\apk\debug\app-debug.apk`

---

## 💡 주의 사항 및 팁
- **앱이 바뀌지 않나요?**: 휴대폰에 설치된 기존 앱을 **삭제(Uninstall)** 한 후 새롭게 설치하는 것이 가장 확실합니다.
- **Node 버전 오류**: 시스템의 기본 Node 버전이 낮아도, 위 방식대로 `node.exe`의 절대 경로를 직접 호출하면 문제 없이 동기화가 가능합니다.
- **Gradle 관련 오류**: 안드로이드 스튜디오의 **Sync Project with Gradle Files** 아이콘(코끼리 모양)을 클릭하여 동기화를 진행해 보세요.
