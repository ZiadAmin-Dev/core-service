import { validate } from 'class-validator';
import { appError } from '../error/appError';

export async function validateBody<T extends object>(cls: new () => T, body: unknown): Promise<T> {

    const instance: T = Object.assign(new cls(), body);
    const errors : any = await validate(instance, { whitelist: true });

    if (errors.length > 0) {
        const messages = errors.flatMap((e: any) => Object.values(e.constraints ?? {}));
        throw new appError(messages.join(', \n'), 400);
    }
    return instance;
}