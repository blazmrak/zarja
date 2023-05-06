import { Config, ConfigDefinition, initializeEnvironment, Var } from './index'
import { expectTypeOf } from 'expect-type'

function extractError(callback: Function): any {
  try {
    callback()
    return undefined
  } catch (e) {
    return e
  }
}

describe('config', () => {
  describe('string', () => {
    it('parses basic options', () => {
      const env = { STR: 'str', OD: 'overriden' }

      const config = initializeEnvironment(
        {
          defaultStr: Var.string().default('default'),
          od: Var.string().default('default'),
          optionalStr: Var.string().optional(),
          str: Var.string(),
          namedStr: Var.string().name('STR'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toEqualTypeOf<{
        defaultStr: string
        od: string
        optionalStr: string | undefined
        str: string
        namedStr: string
      }>()
    })
  })

  describe('number', () => {
    it('parses basic options', () => {
      const env = { NUM: '2', OD: '1' }

      const config = initializeEnvironment(
        {
          defaultNum: Var.number().default(3),
          od: Var.number().default(3),
          optionalNum: Var.number().optional(),
          num: Var.number(),
          namedNum: Var.number().name('NUM'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toEqualTypeOf<{
        defaultNum: number
        od: number
        optionalNum: number | undefined
        num: number
        namedNum: number
      }>()
    })

    it('Fails on invalid number', () => {
      const env = { NUM: 'abc' }

      const e = extractError(() =>
        initializeEnvironment(
          {
            num: Var.number(),
          },
          { env },
        ),
      )

      expect(e).toMatchSnapshot()
    })
  })

  describe('boolean', () => {
    it('parses basic options', () => {
      const env = { BOOL: 'true', OD: 'false' }

      const config = initializeEnvironment(
        {
          defaultBool: Var.boolean().default(true),
          od: Var.boolean().default(true),
          optionalBool: Var.boolean().optional(),
          bool: Var.boolean(),
          namedBool: Var.boolean().name('BOOL'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toEqualTypeOf<{
        defaultBool: boolean
        od: boolean
        optionalBool: boolean | undefined
        bool: boolean
        namedBool: boolean
      }>()
    })
  })

  describe('enum', () => {
    enum Test {
      VALID = 'valid',
      OK = 'ok',
    }

    it('parses with enum definition', () => {
      const env = { ENUM: 'valid', OD: 'ok' }

      const config = initializeEnvironment(
        {
          defaultEnum: Var.enum(Test).default(Test.VALID),
          od: Var.enum(Test).default(Test.VALID),
          optionalEnum: Var.enum(Test).optional(),
          enum: Var.enum(Test),
          namedEnum: Var.enum(Test).name('ENUM'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toEqualTypeOf<{
        defaultEnum: Test
        od: Test
        optionalEnum: Test | undefined
        enum: Test
        namedEnum: Test
      }>()
    })

    it('parses with array definition', () => {
      const env = { ENUM: 'valid', OD: 'ok' }

      const config = initializeEnvironment(
        {
          defaultEnum: Var.enum(['valid', 'ok'] as const).default('valid'),
          od: Var.enum(['valid', 'ok'] as const).default('valid'),
          optionalEnum: Var.enum(['valid', 'ok'] as const).optional(),
          enum: Var.enum(['valid', 'ok'] as const),
          namedEnum: Var.enum(['valid', 'ok'] as const).name('ENUM'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toEqualTypeOf<{
        defaultEnum: 'valid' | 'ok'
        od: 'valid' | 'ok'
        optionalEnum: 'valid' | 'ok' | undefined
        enum: 'valid' | 'ok'
        namedEnum: 'valid' | 'ok'
      }>()
    })

    it('fails if environment does not match the enum', () => {
      const env = { FAIL: 'invalid' }

      const e = extractError(() =>
        initializeEnvironment(
          {
            fail: Var.enum(Test),
          },
          { env },
        ),
      )

      expect(e).toMatchSnapshot()
    })
  })

  describe('array', () => {
    describe('type', () => {
      it('expect error if type of result is not string array for array that should contain strings', () => {
        const env = { ARR: '1' }
        const config = initializeEnvironment(
          {
            arr: Var.array('string'),
          },
          { env },
        )

        // @ts-expect-error
        expectTypeOf(config).toEqualTypeOf<{
          arr: number[]
        }>()
      })
    })

    describe('of strings', () => {
      it('parses basic options', () => {
        const env = { ARR: 'str1, whitespace_around   ,3,' }

        const config = initializeEnvironment(
          {
            defaultArr: Var.array('string').default(['d1', 'd2']),
            arr: Var.array('string'),
          },
          { env },
        )

        expect(config).toMatchSnapshot()
        expectTypeOf(config).toEqualTypeOf<{
          defaultArr: string[]
          arr: string[]
        }>()
      })
    })

    describe('of numbers', () => {
      it('parses basic options', () => {
        const env = { ARR: '5,6' }

        const config = initializeEnvironment(
          {
            defaultArr: Var.array('number').default([1, 2]),
            arr: Var.array('number'),
            overrides: Var.array('number').default([3]).name('ARR'),
          },
          { env },
        )

        expect(config).toMatchSnapshot()
        expectTypeOf(config).toEqualTypeOf<{
          defaultArr: number[]
          arr: number[]
          overrides: number[]
        }>()
      })
    })
  })
})
