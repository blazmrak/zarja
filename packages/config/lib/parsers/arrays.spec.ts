import { initializeEnvironment } from '../index'
import { expectTypeOf } from 'expect-type'
import { Var } from './index'

describe('array parser', () => {
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
      expectTypeOf(config).toMatchTypeOf<{
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
      expectTypeOf(config).toMatchTypeOf<{
        defaultArr: number[]
        arr: number[]
        overrides: number[]
      }>()
    })
  })

  describe('of enums', () => {
    enum Test {
      TEST = 'test',
      IS = 'is',
    }

    it('parses basic options', () => {
      const env = { ARR: 'test,is' }

      const config = initializeEnvironment(
        {
          defaultArr: Var.array(['test', 'is'] as const).default(['test']),
          arr: Var.array(['test', 'is'] as const),
          arrEnum: Var.array(Test).name('ARR'),
          overrides: Var.array(Test).default([Test.IS]).name('ARR'),
        },
        { env },
      )

      expect(config).toMatchSnapshot()
      expectTypeOf(config).toMatchTypeOf<{
        defaultArr: ('test' | 'is')[]
        arr: ('test' | 'is')[]
        arrEnum: Test[]
        overrides: Test[]
      }>()
    })
  })
})
