import { ZodType, ZodTypeDef, z } from 'zod';

declare module 'zod' {
  interface ZodTypeAny extends ZodType<any, ZodTypeDef, any> {}

  // Adding missing properties for legacy Zod compatibility
  interface ZodObject<T, O, I> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodOptional<T> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodEnum<T> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodNullable<T> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodRecord<K, V> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodString {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodNumber {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodPipe<A, B> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodTransform<I, O> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }

  interface ZodInt extends ZodType<number, ZodTypeDef, number> {
    _type: any;
    _parse: any;
    _getType: any;
    _getOrReturnCtx: any;
    _processInputParams: any;
    _parseSync: any;
    _parseAsync: any;
    _getDef: any;
    safeParse: any;
    spa: any;
    min: any;
    max: any;
    _zod: any;
  }
} 