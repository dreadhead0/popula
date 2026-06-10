import {
    ALLOWED_GENDERS,
    ALLOWED_PURCHASED_CATEGORIES,
    type Gender,
    type PurchasedCategory,
    type SkipReason,
} from "../../constants/demographic-schema";

export type RawDemographicCsvRow = {
    id?: string;
    full_name?: string;
    gender?: string;
    age?: string;
    country?: string;
    income?: string;
    purchased_category?: string;
    created_at?: string;
};

export type ValidDemographicRow = {
    fullName: string;
    gender: Gender;
    age: number;
    country: string;
    income: number;
    purchasedCategory: PurchasedCategory;
    createdAt: string;
};

export type RowValidationResult =
    | {
        valid: true;
        data: ValidDemographicRow;
    }
    | {
        valid: false;
        reason: SkipReason;
    };

const isValidDateString = (value: string) => {
    const date = new Date(value);

    return !Number.isNaN(date.getTime());
};

export const validateDemographicRow = (
    row: RawDemographicCsvRow
): RowValidationResult => {
    const fullName = row.full_name?.trim().replace(/\s+/g, " ");

    if (!fullName) {
        return {
            valid: false,
            reason: "missing_name",
        };
    }

    const age = Number(row.age);

    if (!Number.isInteger(age) || age < 5 || age > 90) {
        return {
            valid: false,
            reason: "invalid_age",
        };
    }

    const gender = row.gender?.trim().toLowerCase();

    if (!ALLOWED_GENDERS.includes(gender as Gender)) {
        return {
            valid: false,
            reason: "invalid_gender",
        };
    }

    const country = row.country?.trim();

    if (!country) {
        return {
            valid: false,
            reason: "missing_country",
        };
    }

    const income = Number(row.income);

    if (!Number.isFinite(income) || income < 0) {
        return {
            valid: false,
            reason: "invalid_income",
        };
    }

    const purchasedCategory = row.purchased_category?.trim();

    if (
        !ALLOWED_PURCHASED_CATEGORIES.includes(
            purchasedCategory as PurchasedCategory
        )
    ) {
        return {
            valid: false,
            reason: "invalid_category",
        };
    }

    const createdAt = row.created_at?.trim();

    if (!createdAt || !isValidDateString(createdAt)) {
        return {
            valid: false,
            reason: "invalid_created_at",
        };
    }

    return {
        valid: true,
        data: {
            fullName,
            gender: gender as Gender,
            age,
            country,
            income,
            purchasedCategory: purchasedCategory as PurchasedCategory,
            createdAt,
        },
    };
};