export const ALLOWED_GENDERS = ["male", "female", "rather not say"] as const;

export const ALLOWED_PURCHASED_CATEGORIES = [
    "Electronics",
    "Clothing",
    "Home",
    "Books",
    "Sports",
] as const;

export const REQUIRED_CSV_HEADERS = [
    "id",
    "full_name",
    "gender",
    "age",
    "country",
    "income",
    "purchased_category",
    "created_at",
] as const;

export type Gender = (typeof ALLOWED_GENDERS)[number];

export type PurchasedCategory = (typeof ALLOWED_PURCHASED_CATEGORIES)[number];

export type SkipReason =
    | "duplicate"
    | "invalid_age"
    | "missing_name"
    | "invalid_gender"
    | "invalid_income"
    | "invalid_category"
    | "invalid_created_at"
    | "missing_country"
    | "invalid_row";