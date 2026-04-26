# 🕯️ שולחן ערוך

[![Latest Release](https://img.shields.io/github/v/release/MaozEpsein/SetTable?label=Latest%20Release)](https://github.com/MaozEpsein/SetTable/releases/latest)

אפליקציה לתכנון ארוחות שבת משותפות עם המשפחה והחברים.

## 📥 הורדה / כניסה

### אנדרואיד (APK ישיר)
קישור קבוע — תמיד מצביע על הגרסה האחרונה:

**<https://github.com/MaozEpsein/SetTable/releases/latest/download/SetTable.apk>**

פתחו את הקובץ במכשיר ואשרו "התקנה ממקור לא מוכר" אם תתבקשו.

### אייפון / מחשב (PWA)
פתחו את האתר בדפדפן:

**<https://settable-97985.web.app>**

באייפון: בסאפארי → "שיתוף" → "הוסף למסך הבית". באנדרואיד/כרום: יופיע כפתור "התקן אפליקציה".

## למה?

מארגנים שבת משותפת? מי מביא את הצ'ולנט? מי מכין סלט? מי שכח שהוא אמור להביא קוגל?
**שולחן ערוך** הופך את הבלגן לסדר: יוצרים קבוצה, מוסיפים מאכלים, ומשבצים מי מכין מה - וכולם רואים את אותה התמונה בזמן אמת.

---

## תכונות


### כניסה והרשמה
- כניסה בשם בלבד — בלי הרשמה, בלי סיסמה, בלי קוד SMS
- השם נשמר במכשיר ומופיע לשאר חברי הקבוצה

### קבוצות
- יצירת קבוצה חדשה עם **קוד הזמנה בן 6 תווים**
- הצטרפות לקבוצה קיימת עם הקוד
- שיתוף הקוד דרך WhatsApp / כל אפליקציית מסרים
- רשימת הקבוצות שלך מוצגת במסך הבית

### ניהול מאכלים
לכל קבוצה רשימת מאכלים עצמאית, מקובצת לפי קטגוריות:
- 🥩 מנת בשר
- 🐟 דגים
- 🍚 פחמימה
- 🥗 סלט
- 🥣 מטבלים
- 🍰 מנה אחרונה
- 🎂 עוגות

ניתן להוסיף קטגוריות מותאמות אישית ולמחוק אותן (לחיצה ארוכה).
מאכל יכול להשתייך לכמה קטגוריות במקביל.

### דף מאכל
לחיצה על מאכל פותחת את הדף שלו עם:
- 📷 תמונות (אפשר להוסיף כמה שרוצים)
- 📝 מתכון
- 💭 הערות נוספות

מהדף ניתן ללחוץ "הוסף לארוחה" ולבחור באיזו ארוחה לשבץ אותו.
כפתור עריכה מאפשר לעדכן את כל הפרטים, להוסיף/למחוק תמונות, ולמחוק את המאכל לחלוטין (עם אישור).

### שיבוץ לארוחות
חמש סעודות לכל שבת:
- 🌙 סעודת ערב שבת
- 🍷 קידוש
- ☀️ סעודת צהריי שבת
- 🌅 סעודה שלישית
- 📋 כללי

לכל מאכל ששובץ:
- **שיבוץ אדם** שיכין אותו (את עצמך או חבר אחר)
- **סימון ✓ "הוכן"** עם רקע ירוק וקו חצוב
- **לחיצה ארוכה** להסרת השיבוץ

### סנכרון בזמן אמת
כל שינוי שאחד החברים עושה — הוספת מאכל, שיבוץ, סימון "הוכן" — **כל השאר רואים מיד**.

### הגדרות
- **שינוי שם** — מתעדכן אוטומטית בכל הקבוצות שלך
- **התנתקות** — איפוס מקומי וחזרה למסך הפתיחה
- **עזיבת קבוצה** — הסרה ממסך החברים

### התראות Push
- כשמישהו אחר משבץ אותך להכין מאכל — מקבלים התראה במכשיר
- ההתראה מציינת מי שיבץ, איזה מאכל, ולאיזו סעודה
- בכניסה הראשונה האפליקציה מבקשת הרשאת התראות
- אם דוחים את ההרשאה — האפליקציה ממשיכה לעבוד רגיל, רק בלי הפושים

> **מגבלות:** Push ב-Expo Go לא נתמך ב-iOS (החל מ-SDK 53) ודורש EAS project ID ב-Android.
> כדי להפעיל Push לכל המשתתפים, יש לבנות development build דרך `eas build` (מחוץ ל-MVP).
> בכל מקרה הסנכרון בזמן אמת ב-Firestore עדיין עובד, אז שינויים מתעדכנים מיד באפליקציה הפתוחה.

---

## טכנולוגיה

| רכיב | טכנולוגיה |
|------|-----------|
| Frontend | Expo (React Native) + TypeScript |
| ניווט | React Navigation (Native Stack) |
| Backend / סנכרון בזמן אמת | Firebase Firestore |
| זיהוי משתמש | Firebase Anonymous Auth |
| אחסון מקומי | AsyncStorage |
| פונט עברי | Heebo (Google Fonts) |
| שיתוף קוד | expo-clipboard + expo-sharing |
| התראות Push | expo-notifications + Expo Push Service |

## הרצה

```bash
npm install
npx expo start
```

מתקינים את **Expo Go** מ-App Store / Google Play, סורקים את ה-QR, והאפליקציה רצה על המכשיר.

---

## רעיונות לפיתוח עתידי

### 🌐 הפצה דו-ראשית: APK לאנדרואיד + PWA לאייפון/מחשב
**המוטיבציה:** רוב המשפחה באנדרואיד אבל יש בני משפחה עם אייפון. Apple דורשים $99/שנה לאפליקציה native אמיתית. הפתרון החינמי: לבנות גרסת web (PWA) ש"מתחזה" לאפליקציה — מקבלת אייקון על מסך הבית, רצה במצב fullscreen, מסונכרנת בזמן אמת עם הגרסה הנייטיב דרך אותה Firebase.

**ארכיטקטורה:**
```
Firebase (אותה דאטה)
    ├── Android native (APK דרך EAS Build)
    └── PWA web (Firebase Hosting)
            └── אייפון, מחשב, גם אנדרואיד אם רוצים
```

**שלבי מימוש:**
1. **התקנת web stack:**
   ```bash
   npx expo install react-native-web react-dom @expo/metro-runtime
   ```
2. **Wrappers ל-components לא תואמים:**
   - `react-native-gesture-handler` — fallback ל-`onPress` רגיל ב-web (אין pinch zoom ב-web אבל הדפדפן נותן את זה native)
   - `expo-image-picker` — להחליף ב-`<input type="file">` ב-web
   - `expo-clipboard` — להשתמש ב-`navigator.clipboard` ב-web
   - `expo-sharing` — להשתמש ב-Web Share API ב-web
   - `react-native-async-storage` — מעובד אוטומטית ל-localStorage דרך RN-Web
   - `expo-notifications` — לא נתמך ב-iOS PWA, צריך fallback (or skip)
3. **בדיקת אופי web:**
   ```bash
   npx expo start --web
   ```
4. **בנייה לפרודקשן:**
   ```bash
   npx expo export --platform web
   ```
5. **פריסה ל-Firebase Hosting:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```
6. **הפצה למשתמשים:**
   - שיתוף URL `https://shulchan-aruch.web.app`
   - אייפון: Safari → "שתף" → "הוסף למסך הבית"
   - אנדרואיד native: בנייה דרך `eas build --profile preview --platform android` והעברת APK

**עלויות:** 0 ש"ח חד-פעמי, 0 ש"ח חודשי (בתוך free-tier של Firebase Hosting + Spark plan).

**מגבלות PWA באייפון:**
- Push notifications: רק מ-iOS 16.4+ ורק אחרי "הוסף למסך הבית"
- חוויית fullscreen קצת פחות חלקה מ-native
- ביצועים ~10-20% איטיים יותר מ-native

### 🛒 רשימת קניות אוטומטית
אגרגציה של כל המצרכים מהמתכונים של מאכלים שמשובצים לארוחות → רשימת קניות אחת מסוננת לפי סופר/קטגוריה.

**מבנה נדרש:**
- שדה חדש בעריכת מאכל: `ingredients: [{name, quantity, unit}]`
- בלשונית הארוחות (או חדשה "קניות"): כפתור "צור רשימת קניות"
- אגרגציה: סכימת אותם מצרכים (5 בצלים מ-3 מתכונים → "בצלים: 5")
- צ'קליסט עם סימון "קניתי"
- כפתור שיתוף ב-WhatsApp

**גישות מימוש (פשוט → מורכב):**
1. **ידני בלבד** — המשתמש מוסיף שדות מובנים בעריכת מתכון. אגרגציה אוטומטית.
2. **AI** — הקוד שולח את טקסט המתכון ל-Claude/GPT, מקבל JSON של מצרכים. עלות קטנה לשאילתה.
3. **משולב** — כפתור "🤖 חלץ מצרכים אוטומטית" שממלא את הטופס; המשתמש עורך לפי הצורך.

**אתגרים:** המרת יחידות (כוס/ק"ג/יחידות), שמות זהים לפעמים שונים ("בצל" vs "בצל סגול"), חישוב מנות לפי מספר אורחים.

### 🔔 התראות נוספות
- "מישהו סיים להכין" כשמסמנים ✓ "הוכן"
- "X הצטרף לקבוצה" כשחבר חדש מצטרף
- תזכורת יום חמישי למי שמשובץ ועוד לא סימן הוכן

### 📅 תכנון מספר שבתות קדימה
כל סעודה מוצמדת לתאריך שבת ספציפי, לא רק "השבת הקרובה".

### 👥 RSVP — מי בא?
סוקר חברים: "כמה אתה והמשפחה? עם ילדים?" — לעוזר לחישוב כמויות.

### 🥕 דיאטות והגבלות
תיוג חברים (צמחוני / טבעוני / ללא גלוטן) → אזהרה אם יש שיבוץ שלא מתאים.

### 📊 סטטיסטיקות מאכל
"חמין הוכן 12 פעמים, בדרך כלל ע"י דנה" + "פעם אחרונה: לפני 4 שבועות".

### 🛡️ מנהלי קבוצה
רק יוצר הקבוצה יכול למחוק חברים, סעודות מותאמות, היסטוריה.

### 📤 שיתוף תפריט / היסטוריה
ייצוא היסטוריה כ-PDF, או קישור web ציבורי לתפריט שבת.

### 🎯 שיבוץ אוטומטי
"תכנן לי שבת מהמועדפים" — אלגוריתם שבוחר אחד מכל קטגוריה.

---

## פלטת צבעים

- רקע: לבן קרם (`#FBF7F0`)
- טקסט: כחול עמוק (`#1F2A44`)
- ראשי: זהב חם (`#C9943B`)
- משני: טורקיז רך (`#5B8E9A`)
- ✓ "הוכן": ירוק זית (`#7A9D54`)
- אזהרה: חום-כתום (`#C97D5D`)

---

## מבנה הפרויקט

```
SetTable/
├── App.tsx                          ← נקודת כניסה + זרימת ה-auth
├── app.json                         ← הגדרות Expo
├── src/
│   ├── theme.ts                     ← פלטת צבעים, ריווחים, פונטים
│   ├── firebase.ts                  ← אתחול Firebase
│   ├── storage.ts                   ← AsyncStorage helpers
│   ├── types.ts                     ← Group, Food, Meal, Member, קטגוריות
│   ├── components/
│   │   ├── PrimaryButton.tsx        ← כפתור עם 3 וריאנטים
│   │   ├── ScreenHeader.tsx         ← כותרת מסך עם כפתור חזרה
│   │   ├── SegmentedTabs.tsx        ← בורר טאבים בסגנון pill
│   │   ├── AddFoodModal.tsx         ← הוספת מאכל לקטלוג
│   │   ├── AddFoodToSlotModal.tsx   ← שיבוץ מאכל לסעודה
│   │   ├── AssigneePickerModal.tsx  ← בחירת מי מכין
│   │   ├── FoodsTab.tsx             ← קטלוג מאכלי הקבוצה
│   │   ├── MealsTab.tsx             ← 5 סעודות + שיבוצים
│   │   └── MembersTab.tsx           ← חברים, קוד הזמנה, עזיבה
│   ├── context/
│   │   └── UserContext.tsx          ← uid + שם + signOut
│   ├── hooks/
│   │   ├── useGroup.ts              ← קבוצה יחידה (real-time)
│   │   ├── useGroups.ts             ← הקבוצות שלי (real-time)
│   │   ├── useFoods.ts              ← מאכלי הקבוצה
│   │   └── useAssignments.ts        ← השיבוצים של הקבוצה
│   ├── navigation/
│   │   ├── types.ts                 ← Stack params
│   │   └── RootNavigator.tsx        ← Native Stack
│   ├── screens/
│   │   ├── OnboardingScreen.tsx     ← הזנת שם
│   │   ├── HomeScreen.tsx           ← רשימת קבוצות + ⚙️
│   │   ├── CreateGroupScreen.tsx    ← יצירת קבוצה
│   │   ├── JoinGroupScreen.tsx      ← הצטרפות עם קוד
│   │   ├── GroupScreen.tsx          ← 3 הטאבים
│   │   ├── SettingsScreen.tsx       ← פרופיל + התנתקות
│   │   └── FirebaseSetupScreen.tsx  ← מסך נפילה אם Firebase לא מוגדר
│   └── services/
│       ├── auth.ts                  ← ensureAnonymousAuth
│       ├── groups.ts                ← create / join / leave / rename
│       ├── foods.ts                 ← קטלוג המאכלים (CRUD)
│       ├── assignments.ts           ← שיבוצים (CRUD + cascade)
│       └── push.ts                  ← רישום ושליחת התראות Push
```

---

## תמונות מאכלים — Cloudinary

תמונות לדף המאכל לא נשמרות ב-Firebase (Storage דורש billing/credit-card). במקום זאת:

- **אחסון:** Cloudinary (free tier 25GB, ללא credit card)
- **קונפיגורציה:** ב-`src/services/cloudinary.ts` — cloud name + unsigned upload preset
- **כיווץ לפני העלאה:** JPEG @ 0.7, רוחב מקסימלי 1024px (`expo-image-manipulator`)
- **שמירה ב-Firestore:** ה-URL בלבד נשמר ב-`food.images` (מערך URLs)

**מחיקה:** Cloudinary unsigned uploads לא תומכים במחיקה מהלקוח (דורש API secret על שרת). כשמסירים תמונה מ-UI — ה-URL נמחק מ-Firestore אבל הקובץ נשאר orphan ב-Cloudinary. ב-25GB free tier זה לא מהווה בעיה לאפליקציה משפחתית.

---

## הוספת חוקי Firestore עבור Push

חובה — אחרת רישום הטוקן של ה-Push ייכשל ב-`permission-denied`. הוסף את החוק הבא לחוקים הקיימים שלך ב-Firestore:

```
match /pushTokens/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

(החוק הזה כלול גם בחוקים הקשיחים בהמשך.)

---

## חוקי Firestore מומלצים (שדרוג אבטחה לאחר MVP)

החוקים הראשוניים מתירים לכל משתמש מזוהה לקרוא ולכתוב לכל קבוצה. לפני שיתוף עם משתמשים מחוץ למשפחה, החלף ב-Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      // קריאת מסמך הקבוצה: רק חברים, או חיפוש לפי קוד
      allow get: if request.auth != null &&
        request.auth.uid in resource.data.memberUids;
      allow list: if request.auth != null;
      // יצירת קבוצה: היוצר חייב להיות בתוך memberUids
      allow create: if request.auth != null &&
        request.auth.uid in request.resource.data.memberUids;
      // עדכון: רק חברים, או הצטרפות (הוספת self ל-memberUids)
      allow update: if request.auth != null && (
        request.auth.uid in resource.data.memberUids ||
        request.auth.uid in request.resource.data.memberUids
      );
      allow delete: if false;

      // תת-קולקציות (foods, assignments): רק חברים
      match /{document=**} {
        allow read, write: if request.auth != null &&
          request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.memberUids;
      }
    }

    // טוקני Push: כל משתמש מזוהה יכול לקרוא טוקנים של אחרים
    // (כדי לשלוח להם התראות), אבל רק לכתוב את הטוקן של עצמו
    match /pushTokens/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## שחרור גרסה חדשה

כל push של תגית `v*` מפעיל את ה-workflow `release.yml`, שבונה APK ומפרסם אותו כ-GitHub Release. הקישור הקבוע (`releases/latest/download/SetTable.apk`) יצביע אוטומטית על הגרסה החדשה.

```bash
# 1. עדכנו את expo.version וגם את expo.android.versionCode ב-app.json
#    (חשוב להעלות versionCode — אחרת אנדרואיד לא יציע התקנה על גבי גרסה ישנה)
git commit -am "release vX.Y.Z"
git tag vX.Y.Z
git push && git push origin vX.Y.Z
```

ה-CI (`ci.yml`) רץ על כל push/PR ובונה debug APK כ-artifact, כך שאפשר להוריד build בדיקה גם בלי תגית.

---

## רישוי

פרטי - שימוש אישי / משפחתי.
