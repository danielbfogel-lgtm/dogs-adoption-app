import type {
  DogAgeRange,
  DogStatus,
  FamilyStructure,
  ProfileRole,
  SheddingPreference,
  SizePreference,
} from "@/lib/supabase/types";
import type { MatchStatus } from "@/lib/match-api";

/**
 * Central Hebrew translation dictionary — source of truth for every
 * user-facing UI string. NOT wired into any component yet; this file only
 * defines the data. Keys are English and descriptive; values are the Hebrew
 * display text. DB/API/enum values are never altered — see `ENUM_LABELS`
 * below, which maps each existing English enum value to a Hebrew label.
 */

export const he = {
  common: {
    save: "שמירה",
    cancel: "ביטול",
    confirm: "אישור",
    delete: "מחיקה",
    edit: "עריכה",
    tryAgain: "נסו שוב",
    dismissNotification: "סגירת התראה",
    unknown: "לא ידוע",
    notSet: "לא הוגדר",
    optional: "לא חובה",
  },

  nav: {
    allDogs: "כל הכלבים",
    myMatches: "ההתאמות שלי",
    manageUsers: "ניהול משתמשים",
    login: "התחברות",
    register: "הרשמה",
    myProfile: "הפרופיל שלי",
    logout: "התנתקות",
    accountMenu: "תפריט חשבון",
  },

  home: {
    metaTitle: "אימוץ כלבים",
    metaDescription: "מצאו את החבר הכי טוב החדש שלכם — בהתאמה לאורח החיים של המשפחה.",
    feature1Title: "עיינו בכלבים זמינים",
    feature1Desc: "חפשו וסננו את כל הכלבים הנמצאים כרגע בתוכנית שלנו.",
    feature2Title: "קבלו התאמה",
    feature2Desc: "האלגוריתם שלנו מדרג כלבים לפי משק הבית ואורח החיים שלכם.",
    feature3Title: "אשרו בביטחון",
    feature3Desc: "עיינו בהתאמות המובילות שלכם ואשרו את אלה שתרצו לפגוש.",
    heroTitle: "מצאו את החבר הכי טוב החדש שלכם",
    heroSubtitle:
      "אנחנו מתאימים כלבים לאימוץ למשפחות על פי רמת אנרגיה, גודל, משק הבית ועוד — כדי שתמצאו כלב שבאמת מתאים לחיים שלכם.",
    browseDogs: "עיינו בכלבים",
    viewMyMatches: "צפו בהתאמות שלי",
    createAccount: "צרו חשבון",
  },

  auth: {
    login: {
      metaTitle: "התחברות — אימוץ כלבים",
      heading: "ברוכים השבים",
      subheading: "התחברו כדי לראות את ההתאמות שלכם.",
      emailLabel: "אימייל",
      passwordLabel: "סיסמה",
      submit: "התחברות",
      submitPending: "מתחבר...",
      noAccount: "אין לכם חשבון? ",
      registerLink: "הרשמה",
    },
    register: {
      metaTitle: "הרשמה — אימוץ כלבים",
      heading: "צרו את החשבון שלכם",
      subheading: "הירשמו כדי להתחיל למצוא את החבר הכי טוב החדש שלכם.",
      emailLabel: "אימייל",
      passwordLabel: "סיסמה",
      passwordHint: "חייבת להכיל לפחות 6 תווים.",
      confirmPasswordLabel: "אימות סיסמה",
      submit: "יצירת חשבון",
      submitPending: "יוצר חשבון...",
      haveAccount: "כבר יש לכם חשבון? ",
      loginLink: "התחברות",
    },
    passwordToggle: {
      show: "הצגת סיסמה",
      hide: "הסתרת סיסמה",
    },
  },

  profile: {
    view: {
      metaTitle: "הפרופיל שלי — אימוץ כלבים",
      emptyHeading: "השלימו את הפרופיל שלכם",
      emptyBody: "אנחנו זקוקים לכמה פרטים עליכם ועל משק הבית שלכם לפני שנוכל למצוא התאמות לכלבים.",
      completeProfileCta: "השלימו את הפרופיל שלכם",
      savedBanner: "הפרופיל נשמר.",
      heading: "הפרופיל שלי",
      editLink: "עריכה",
      sectionAboutYou: "עליכם",
      sectionHousehold: "משק הבית שלכם",
      sectionLookingFor: "מה שאתם מחפשים",
      fieldName: "שם",
      fieldDob: "תאריך לידה",
      fieldPhone: "מספר טלפון",
      fieldFamilyStructure: "מבנה משפחתי",
      fieldHouseholdSize: "גודל משק הבית",
      fieldNumberOfChildren: "מספר ילדים",
      fieldYoungestChildAge: "גיל הילד הצעיר",
      fieldDogsAtHome: "כלבים הגרים איתכם כיום",
      fieldCatsAtHome: "חתולים הגרים איתכם כיום",
      fieldEnergyLevel: "רמת אנרגיה מועדפת",
      fieldSize: "גודל מועדף",
      fieldDogAge: "טווח גיל מועדף",
      fieldSheds: "העדפת נשירת שיער",
    },
    edit: {
      metaTitle: "עריכת פרופיל — אימוץ כלבים",
      headingEdit: "עריכת הפרופיל שלכם",
      headingCreate: "השלימו את הפרופיל שלכם",
      subheading: "זה יעזור לנו למצוא את ההתאמות הנכונות עבורכם.",
    },
    form: {
      validationBanner: "נא לתקן את השגיאות המסומנות למטה.",
      sectionAboutYou: "עליכם",
      fieldFirstName: "שם פרטי",
      fieldLastName: "שם משפחה",
      fieldDob: "תאריך לידה",
      optionalHint: "לא חובה",
      fieldPhone: "מספר טלפון",
      sectionHousehold: "משק הבית שלכם",
      fieldFamilyStructure: "מבנה משפחתי",
      placeholderFamilyStructure: "בחרו את המבנה המשפחתי שלכם",
      fieldNumberOfChildren: "מספר ילדים",
      fieldHouseholdSize: "גודל משק הבית",
      householdSizeHint: "כל מי שגר בבית, כולל אתכם",
      fieldYoungestChildAge: "גיל הילד הצעיר",
      fieldDogsAtHome: "כלבים הגרים איתכם כיום",
      fieldCatsAtHome: "חתולים הגרים איתכם כיום",
      sectionLookingFor: "מה שאתם מחפשים",
      fieldPreferredEnergy: "רמת אנרגיה מועדפת",
      placeholderEnergy: "בחרו רמת אנרגיה",
      fieldPreferredSize: "גודל מועדף",
      placeholderSize: "בחרו העדפת גודל",
      fieldPreferredDogAge: "טווח גיל מועדף",
      placeholderDogAge: "בחרו טווח גיל מועדף",
      fieldShedsPref: "העדפת נשירת שיער",
      placeholderSheds: "בחרו העדפת נשירת שיער",
      submitPending: "שומר...",
      submit: "שמירת פרופיל",
    },
  },

  dogs: {
    gallery: {
      metaTitle: "כל הכלבים — אימוץ כלבים",
      metaDescription: "עיינו בכל הכלבים הזמינים לאימוץ.",
      heading: "כל הכלבים",
      subheading: "עיינו בכל הכלבים הנמצאים כרגע בתוכנית שלנו.",
      addDog: "הוספת כלב",
      searchPlaceholder: "חיפוש כלבים לפי שם...",
      searchAriaLabel: "חיפוש כלבים לפי שם",
      loadError: "לא ניתן היה לטעון את הכלבים. נסו שוב.",
      loadMoreError: "לא ניתן היה לטעון כלבים נוספים. נסו שוב.",
      noResultsForTemplate: 'לא נמצאו כלבים התואמים ל-"{search}".',
      noneAvailable: "אין כרגע כלבים זמינים.",
      showingCountTemplate: "מוצגים {count} מתוך {total} כלבים",
      loadMore: "טענו עוד",
    },
    details: {
      metaTitleWithNameTemplate: "{name} — אימוץ כלבים",
      metaTitleFallback: "כלב לא נמצא — אימוץ כלבים",
      backToAllDogs: "חזרה לכל הכלבים",
      edit: "עריכה",
      sizeLabel: "גודל",
      energyLabel: "רמת אנרגיה",
      compatibilityHeading: "התאמה",
      goodWithChildren: "התאמה לילדים",
      goodWithDogs: "התאמה לכלבים אחרים",
      goodWithCats: "התאמה לחתולים",
      sheds: "נשירת שיער",
    },
    notFound: {
      heading: "הכלב לא נמצא",
      body: "ייתכן שהכלב הזה אומץ, הוסר, או שהקישור שגוי.",
      browseAllDogs: "עיינו בכל הכלבים",
    },
    form: {
      validationBanner: "נא לתקן את השגיאות המסומנות למטה.",
      fieldsetBasics: "פרטים בסיסיים",
      fieldName: "שם",
      fieldDob: "תאריך לידה",
      dobHint: "לא חובה — משמש לחישוב הגיל",
      fieldStatus: "סטטוס",
      placeholderStatus: "בחרו סטטוס",
      fieldBreed: "גזע",
      placeholderBreed: "בחרו גזע",
      fieldBreedCustom: "גזע (פירוט)",
      fieldsetTraits: "תכונות",
      fieldSize: "גודל",
      placeholderSize: "בחרו גודל",
      fieldEnergyLevel: "רמת אנרגיה",
      placeholderEnergyLevel: "בחרו רמת אנרגיה",
      fieldGoodWithChildren: "התאמה לילדים",
      placeholderUnknown: "לא ידוע",
      fieldGoodWithDogs: "התאמה לכלבים אחרים",
      fieldGoodWithCats: "התאמה לחתולים",
      fieldSheds: "נשירת שיער",
      fieldsetPhotoDescription: "תמונה ותיאור",
      fieldDescription: "תיאור",
      descriptionHint: "לא חובה — מוצג בדף פרטי הכלב",
      submitSaving: "שומר...",
      submitUploading: "מעלה תמונה...",
      submitSaveChanges: "שמירת שינויים",
      submitAddDog: "הוספת כלב",
    },
    photoUpload: {
      fileTypeError: "נא לבחור תמונה מסוג JPEG, PNG, WebP או GIF.",
      fileSizeError: "התמונה חייבת להיות בגודל 5MB או פחות.",
      uploadFailedError: "ההעלאה נכשלה. נסו שוב.",
      fieldLabel: "תמונה",
      replacePhoto: "החלפת תמונה",
      uploadPhoto: "העלאת תמונה",
      removePhoto: "הסרת תמונה",
      photoPreviewAlt: "תצוגה מקדימה של התמונה",
    },
    deleteButton: {
      deleteFailed: "מחיקת הכלב נכשלה.",
      confirmPrompt: "למחוק את הכלב הזה?",
    },
    card: {
      unnamedDog: "כלב ללא שם",
      genericAlt: "כלב",
    },
  },

  matches: {
    dashboard: {
      metaTitle: "ההתאמות שלכם — אימוץ כלבים",
      emptyProfileHeading: "השלימו את הפרופיל שלכם",
      emptyProfileBody: "אנחנו זקוקים לכמה פרטים עליכם ועל משק הבית שלכם לפני שנוכל למצוא התאמות לכלבים.",
      completeProfileCta: "השלימו את הפרופיל שלכם",
      heading: "ההתאמות שלכם",
      subheading: "כלבים שהאלגוריתם שלנו חושב שיתאימו נהדר למשק הבית שלכם — 70% התאמה ומעלה.",
      tabAll: "כל ההמלצות",
      tabConfirmed: "מאושרות",
      tabRejected: "נדחו",
      tabLabelWithCountTemplate: "{label} ({count})",
      emptyAll: "אין עדיין המלצות — בדקו שוב בקרוב כשכלבים חדשים יצטרפו לתוכנית.",
      emptyConfirmed: "עדיין לא אישרתם התאמות.",
      emptyRejected: "עדיין לא דחיתם התאמות.",
      loadError: "לא ניתן היה לטעון את ההתאמות שלכם. נסו שוב.",
      confirmToastTemplate: "{dogName} אושר כהתאמה.",
      rejectToastTemplate: "{dogName} נדחה.",
      updateErrorToastTemplate: "לא ניתן היה לעדכן את {dogName}. נסו שוב.",
      dogNameFallback: "הכלב הזה",
      tryAgain: "נסו שוב",
      filterMatchesAria: "סינון התאמות",
      switchViewAria: "החלפת תצוגה",
      tileViewAria: "תצוגת אריחים",
      listViewAria: "תצוגת רשימה",
    },
    card: {
      matchBadgeTemplate: "{percent}% התאמה",
      confirmedRibbon: "מאושר",
      rejectedRibbon: "נדחה",
      approveButton: "אישור",
      confirmedButton: "מאושר",
      rejectButton: "דחייה",
      rejectedButton: "נדחה",
      unnamedDog: "כלב ללא שם",
      energyLevelTitle: "רמת אנרגיה",
    },
  },

  admin: {
    users: {
      list: {
        metaTitle: "ניהול משתמשים — אימוץ כלבים",
        heading: "ניהול משתמשים",
        subheading: "צפייה, יצירה והסרה של חשבונות מאמצים ומנהלים.",
        addUser: "הוספת משתמש",
        searchPlaceholder: "חיפוש משתמשים לפי אימייל...",
        searchAriaLabel: "חיפוש משתמשים לפי אימייל",
        loadError: "לא ניתן היה לטעון את המשתמשים. נסו שוב.",
        loadMoreError: "לא ניתן היה לטעון משתמשים נוספים. נסו שוב.",
        noResultsForTemplate: 'לא נמצאו משתמשים התואמים ל-"{search}".',
        noneYet: "אין עדיין משתמשים.",
        showingCountTemplate: "מוצגים {count} מתוך {total} משתמשים",
        loadMore: "טענו עוד",
        tableHeaderEmail: "אימייל",
        tableHeaderRole: "תפקיד",
        tableHeaderJoined: "הצטרפות",
        tableHeaderActions: "פעולות",
        noEmailFallback: "(אין אימייל)",
        joinedMobileTemplate: "הצטרפו ב-{date}",
        deletedToastTemplate: "{email} נמחק/ה.",
      },
      new: {
        metaTitle: "הוספת משתמש — אימוץ כלבים",
        heading: "הוספת משתמש",
        subheading: "יצירת חשבון מאמץ או מנהל חדש.",
        validationBanner: "נא לתקן את השגיאות המסומנות למטה.",
        createError: "יצירת המשתמש נכשלה.",
        fieldEmail: "אימייל",
        fieldPassword: "סיסמה",
        passwordHint: "חייבת להכיל לפחות 6 תווים.",
        fieldConfirmPassword: "אימות סיסמה",
        placeholderRole: "בחרו תפקיד",
        submitPending: "יוצר...",
        submit: "יצירת משתמש",
      },
      edit: {
        metaTitle: "עריכת משתמש — אימוץ כלבים",
        heading: "עריכת משתמש",
        stillLoadingError: "עדיין בטעינה — נסו שוב.",
        validationBanner: "נא לתקן את השגיאות המסומנות למטה.",
        noChanges: "אין שינויים לשמירה.",
        updated: "המשתמש עודכן.",
        updateFailed: "עדכון המשתמש נכשל.",
        loadFailed: "לא ניתן היה לטעון את המשתמש.",
        tryAgain: "נסו שוב",
        fieldEmail: "אימייל",
        fieldRole: "תפקיד",
        placeholderRole: "בחרו תפקיד",
        cantChangeOwnRole: "אינכם יכולים לשנות את התפקיד שלכם.",
        fieldNewPassword: "סיסמה חדשה",
        fieldConfirmNewPassword: "אימות סיסמה חדשה",
        passwordHint: "השאירו את שדות הסיסמה ריקים כדי לשמור על הסיסמה הנוכחית.",
        submitPending: "שומר...",
        submit: "שמירת שינויים",
        adopterProfileSection: "פרופיל משק בית והתאמה (לקריאה בלבד)",
        noAdopterProfile: "טרם הוגש פרופיל מאמץ.",
      },
      deleteButton: {
        deleteFailed: "מחיקת המשתמש נכשלה.",
        confirmPrompt: "למחוק את המשתמש הזה?",
      },
    },
    dogs: {
      new: {
        metaTitle: "הוספת כלב — אימוץ כלבים",
        heading: "הוספת כלב",
        subheading: "הוספת כלב חדש לתוכנית האימוץ.",
      },
      edit: {
        metaTitle: "עריכת כלב — אימוץ כלבים",
        headingWithNameTemplate: "עריכת {name}",
        headingFallback: "עריכת כלב",
      },
    },
  },

  validation: {
    adopter: {
      firstNameRequired: "שם פרטי הוא שדה חובה.",
      lastNameRequired: "שם משפחה הוא שדה חובה.",
      invalidDate: "הזינו תאריך תקין.",
      birthDateFuture: "תאריך הלידה לא יכול להיות בעתיד.",
      familyStructureRequired: "נא לבחור מבנה משפחתי.",
      householdSizeMin: "גודל משק הבית חייב להיות לפחות 1.",
      energyLevelRequired: "בחרו רמת אנרגיה מועדפת.",
      sizeRequired: "נא לבחור העדפת גודל.",
      shedsRequired: "נא לבחור העדפת נשירת שיער.",
      dogAgeRequired: "נא לבחור טווח גיל מועדף.",
      phoneRequired: "מספר טלפון הוא שדה חובה.",
      phoneInvalid: "הזינו מספר טלפון תקין (7-20 ספרות).",
      mustBeZeroOrMore: "חייב להיות 0 או יותר.",
      requiredWhenChildren: "שדה חובה כאשר יש לכם ילדים.",
    },
    dog: {
      nameRequired: "שם הוא שדה חובה.",
      invalidDate: "הזינו תאריך תקין.",
      birthDateFuture: "תאריך הלידה לא יכול להיות בעתיד.",
      sizeRequired: "נא לבחור גודל.",
      energyLevelRequired: "בחרו רמת אנרגיה.",
      statusRequired: "נא לבחור סטטוס.",
      photoUrlInvalid: "כתובת התמונה חייבת להיות כתובת https תקינה.",
      breedRequired: "נא לציין גזע.",
    },
    adminUser: {
      emailRequired: "אימייל הוא שדה חובה.",
      emailInvalid: "הזינו כתובת אימייל תקינה.",
      passwordMinLength: "הסיסמה חייבת להכיל לפחות 6 תווים.",
      passwordsMismatch: "הסיסמאות אינן תואמות.",
      roleRequired: "נא לבחור תפקיד.",
    },
    auth: {
      emailPasswordRequired: "אימייל וסיסמה הם שדות חובה.",
      passwordMinLength: "הסיסמה חייבת להכיל לפחות 6 תווים.",
      passwordsMismatch: "הסיסמאות אינן תואמות.",
    },
  },

  errors: {
    sessionExpired: "פג תוקף החיבור שלכם. נא להתחבר שוב.",
    fixErrorsBelow: "נא לתקן את השגיאות המסומנות למטה.",
    adopterSaveFailed: "לא ניתן היה לשמור את הפרופיל שלכם. נסו שוב.",
    dogAdminOnly: "רק מנהלים יכולים לנהל כלבים.",
    dogSaveFailed: "לא ניתן היה לשמור את פרטי הכלב. נסו שוב.",
    requestFailedTemplate: "הבקשה נכשלה ({status}).",
  },

  format: {
    ageUnknown: "גיל לא ידוע",
    ageUnderOneYear: "מתחת לשנה",
    ageOneYearOld: "שנה אחת",
    ageYearsOldTemplate: "{age} שנים",
  },
} as const;

/**
 * Enum value → Hebrew display label maps. Keys are the exact, unmodified
 * English DB/API values (never translated or renamed); values are the
 * Hebrew label shown in the UI. `Record<..., string>` keeps every map
 * exhaustive — omitting a value is a compile error.
 */
export const ENUM_LABELS = {
  role: {
    adopter: "מאמץ/ת",
    admin: "מנהל/ת",
  } satisfies Record<ProfileRole, string>,

  dogStatus: {
    available: "זמין",
    pending: "ממתין",
    adopted: "אומץ",
  } satisfies Record<DogStatus, string>,

  matchStatus: {
    pending: "ממתין",
    confirmed: "מאושר",
    rejected: "נדחה",
  } satisfies Record<MatchStatus, string>,

  sheds: {
    no: "ללא נשירה",
    doesnt_matter: "לא משנה",
  } satisfies Record<SheddingPreference, string>,

  // Shared by both `adopters.size` (preference, includes "doesnt_matter")
  // and `dogs.size` (the dog's actual size, a strict subset of these values).
  size: {
    small: "קטן",
    medium: "בינוני",
    large: "גדול",
    doesnt_matter: "לא משנה",
  } satisfies Record<SizePreference, string>,

  dogAge: {
    "0-1": "0–1 שנים (גור)",
    "1-3": "1–3 שנים",
    "3-7": "3–7 שנים",
    "7-10": "7–10 שנים",
    "10+": "10+ שנים (מבוגר)",
  } satisfies Record<DogAgeRange, string>,

  // Not one of the required 6 — added per the glossary's "extend if a term
  // is missing" allowance, since `family_structure` is the same
  // value→label pattern as the others (see lib/adopter-options.ts).
  familyStructure: {
    single: "רווק/ה",
    couple: "זוג (ללא ילדים)",
    family: "משפחה (עם ילדים)",
  } satisfies Record<FamilyStructure, string>,

  // `adopters.energy_level` / `dogs.energy_level` — integer scale 1-5
  // (see lib/adopter-options.ts's ENERGY_LEVEL_OPTIONS).
  energyLevel: {
    1: "1 — נמוכה מאוד",
    2: "2 — נמוכה",
    3: "3 — בינונית",
    4: "4 — גבוהה",
    5: "5 — גבוהה מאוד",
  } satisfies Record<1 | 2 | 3 | 4 | 5, string>,

  // Tri-state yes/no `<select>` for the nullable `good_with_*`/`sheds`
  // boolean columns (see lib/dog-options.ts's DOG_BOOLEAN_OPTIONS). Not a
  // DB enum itself (the columns are real booleans) but the same
  // value→label UI pattern, keyed by the string values that component uses.
  dogBoolean: {
    true: "כן",
    false: "לא",
  } satisfies Record<"true" | "false", string>,

  // `dogs.breed` has no DB CHECK constraint (free text) — this covers the
  // curated dropdown list in lib/dog-options.ts's DOG_BREED_OPTIONS, plus
  // the "Other…" escape hatch (DOG_BREED_OTHER_VALUE = "__other__").
  dogBreed: {
    Mixed: "מעורב",
    Amstaff: "אמסטף (סטפורדשייר אמריקאי)",
    Beagle: "ביגל",
    Boxer: "בוקסר",
    Bulldog: "בולדוג",
    Chihuahua: "צ'יוואווה",
    "Cocker Spaniel": "קוקר ספניאל",
    Dachshund: "דקסונד",
    Doberman: "דוברמן",
    "German Shepherd": "רועה גרמני",
    "Golden Retriever": "גולדן רטריבר",
    "Great Dane": "גרייט דיין",
    Husky: "האסקי",
    "Labrador Retriever": "לברדור רטריבר",
    Maltese: "מלטז",
    Pitbull: "פיטבול",
    Poodle: "פודל",
    Pug: "פאג",
    Rottweiler: "רוטווילר",
    "Shih Tzu": "שיצו",
    "Yorkshire Terrier": "יורקשייר טרייר",
    __other__: "אחר…",
  } satisfies Record<string, string>,
} as const;

export type HeDictionary = typeof he;
export type EnumLabels = typeof ENUM_LABELS;
