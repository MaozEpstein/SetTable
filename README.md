# 🕯️ שולחן ערוך

אפליקציה לתכנון ארוחות שבת משותפות עם המשפחה והחברים.

## למה?

מארגנים שבת משותפת? מי מביא את הצ'ולנט? מי מכין סלט? מי שכח שהוא אמור להביא קוגל?
**שולחן ערוך** הופך את הבלגן לסדר: יוצרים קבוצה, מוסיפים מאכלים, ומשבצים מי מכין מה - וכולם רואים את אותה התמונה בזמן אמת.

## תכונות ב-MVP

### 1. כניסה ראשונה
- מזינים **שם בלבד** (ללא הרשמה, ללא סיסמה, ללא קוד SMS).
- השם נשמר במכשיר.

### 2. קבוצות
- **יצירת קבוצה חדשה:** נותנים לה שם, ומקבלים **קוד הזמנה בן 6 תווים** + קישור לשיתוף ב-WhatsApp.
- **הצטרפות לקבוצה קיימת:** מזינים את הקוד שקיבלתם.
- כל משתמש רואה רשימת הקבוצות שהוא חבר בהן.

### 3. מאכלי הקבוצה
לכל קבוצה רשימת מאכלים עצמאית, מקובצת לפי קטגוריות:
- 🥩 מנת בשר
- 🍚 פחמימה
- 🥗 סלט
- 🍰 מנה אחרונה
- 🎂 עוגות

### 4. שיבוץ לארוחות
חמש ארוחות לכל שבת:
- 🌙 סעודת ערב שבת
- 🍷 קידוש
- ☀️ סעודת צהריי שבת
- 🌅 סעודה שלישית
- 📋 כללי

לכל מאכל ששובץ:
- **משבצים אדם שיכין אותו** (את עצמך או חבר אחר).
- **מסמנים ✓ "הוכן"** כשהמאכל מוכן.

### 5. סנכרון בזמן אמת
כל שינוי שאחד החברים עושה - **כל השאר רואים מיד**.

---

## טכנולוגיה

| רכיב | טכנולוגיה |
|------|-----------|
| Frontend | Expo (React Native) + TypeScript |
| ניווט | React Navigation (Stack + Tabs) |
| Backend / סנכרון בזמן אמת | Firebase Firestore |
| זיהוי משתמש | Firebase Anonymous Auth |
| אחסון מקומי | AsyncStorage |
| שיתוף קוד הזמנה | expo-sharing + expo-clipboard |

## הרצה לפיתוח

```bash
# התקנת תלויות
npm install

# הרצה - יציג QR לסריקה ב-Expo Go
npx expo start
```

מתקינים את האפליקציה **Expo Go** מ-App Store / Google Play, סורקים את ה-QR, והאפליקציה רצה על המכשיר.

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
├── App.tsx                  ← נקודת כניסה + ניווט
├── app.json                 ← הגדרות Expo
├── src/
│   ├── theme.ts             ← פלטת צבעים, ריווחים, פונטים
│   ├── firebase.ts          ← אתחול Firebase (יתווסף בשלב 2)
│   ├── storage.ts           ← AsyncStorage helpers (יתווסף בשלב 1)
│   ├── types.ts             ← Group, Food, Meal, Member
│   ├── screens/             ← מסכי האפליקציה
│   ├── components/          ← רכיבים משותפים
│   └── hooks/               ← React hooks
```

---

## סטטוס פיתוח

- [x] **שלב 0:** תשתית - Expo + TypeScript + RTL + Hello World
- [x] **שלב 1:** Onboarding (הזנת שם) + מסך בית + Theme עברי + פונט Heebo
- [x] **שלב 2:** Firebase + יצירת/הצטרפות לקבוצה + שיתוף קוד
- [x] **שלב 3:** מסך קבוצה עם 3 טאבים + ניהול מאכלים
- [x] **שלב 4:** שיבוץ מאכלים לארוחות + שיבוץ אדם + "הוכן"
- [x] **שלב 5:** ליטוש - מסך הגדרות, שינוי שם, עזיבת קבוצה, התנתקות

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
  }
}
```

---

## רישוי

פרטי - שימוש אישי / משפחתי.
