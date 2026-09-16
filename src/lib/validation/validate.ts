import { validate } from 'class-validator';
import { AppError } from '../error/appError';
import { plainToInstance } from 'class-transformer';

export async function validateBody <T extends object> (cls: new () => T, body: unknown): Promise<T> {

    const instance: T = plainToInstance(cls, body);
    const errors: any[] = await validate(instance, { whitelist: true }); //whitelist: true will strip any properties that do not have decorators in the class definition

    if (errors.length > 0) {
        const messages = errors.flatMap((e: any) => Object.values(e.constraints ?? {}));
        throw new AppError(messages.join(', '), 400);
    }
    return instance;
}