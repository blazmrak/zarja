import { initializeEnvironment } from '../index'
import { expectTypeOf } from 'expect-type'
import { extractError } from '../../tests/helpers/assertions'
import { Var } from './index'

enum Test {
  VALID = 'valid',
  OK = 'ok',
}

describe('enum', () => {
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
    expectTypeOf(config).toMatchTypeOf<{
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
    expectTypeOf(config).toMatchTypeOf<{
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
