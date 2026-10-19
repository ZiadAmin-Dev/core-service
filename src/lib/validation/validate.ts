import { validate, type ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError, type FieldError } from './validation.error';
import { plainToInstance } from 'class-transformer';

export async function validateBody <T extends object> (cls: new () => T, body: unknown): Promise<T> {
    return validateDto(cls, body, false);
}

export async function validateParams<T extends object>(cls: new () => T, params: unknown): Promise<T> {
    return validateDto(cls, params, true);
}

export async function validateQuery<T extends object>(cls: new () => T, query: unknown): Promise<T> {
    return validateDto(cls, query, true);
}

// Alias kept for convenience (`validateParamsQuery` == `validateQuery`).
export const validateParamsQuery = validateQuery;

async function validateDto<T extends object>(
    cls: new () => T,
    source: unknown,
    coercePrimitives: boolean,
): Promise<T> {
    const instance: T = plainToInstance(cls, source, coercePrimitives ? { enableImplicitConversion: true } : undefined);
    const errors: ClassValidatorError[] = await validate(instance, { whitelist: true }); //whitelist: true will strip any properties that do not have decorators in the class definition

    if (errors.length > 0) {
        throw new ValidationError(toFieldErrors(errors));
    }
    return instance;
}

function toFieldErrors(errors: ClassValidatorError[]): FieldError[] {
    return errors.flatMap((e) => {
        const messages = Object.values(e.constraints ?? {});
        const fieldErrors: FieldError[] = messages.map((message) => ({
            field: e.property,
            message: String(message),
        }));
        const nested: FieldError[] = e.children?.length ? toFieldErrors(e.children) : [];
        return [...fieldErrors, ...nested];
    });
}

