import { AppError } from "../error/appError";

export interface FieldError {
    field: string;
    message: string;
}

export class ValidationError extends AppError {
    public readonly errors: FieldError[];

    constructor(errors: FieldError[]) {
        // Send generic "Validation failed" message to AppError with status code 400
        super("Validation failed", 400, true);
        this.errors = errors;
    }
}