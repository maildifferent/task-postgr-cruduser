////////////////////////////////////////////////////////////////////////////////
// Interfaces.
////////////////////////////////////////////////////////////////////////////////
export interface FetchReqI {
  reqTxt: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: HeadersInit
  bodyObj?: object
  descrip?: string
}

////////////////////////////////////////////////////////////////////////////////
// Constants.
////////////////////////////////////////////////////////////////////////////////
export const list_names = [
  'Ace',
  'Ali',
  'Ari',
  'Asa',
  'Avi',
  'Axl',
  'Ben',
  'Dax',
  'Eli',
  'Fox',
  'Ian',
  'Ira',
  'Jax',
  'Jay',
  'Joe',
  'Jon',
  'Kai',
  'Koa',
  'Kye',
  'Lee',
  'Leo',
  'Mac',
  'Max',
  'Neo',
  'Noe',
  'Ray',
  'Rex',
  'Rey',
  'Rio',
  'Roy',
  'Sam',
  'Tru',
  'Van',
  'Wes',
  'Zev',
];

////////////////////////////////////////////////////////////////////////////////
// Utilities.
////////////////////////////////////////////////////////////////////////////////
export interface ErrorResultI {
  ok: false
  error: any
}

export type ResultObligtryI<R> = {
  ok: true
  result: R
} | ErrorResultI

export const testUtil = Object.freeze({
  isResultObligtryType(unknown: unknown): unknown is ResultObligtryI<unknown> {
    if (typeof unknown !== 'object') return false
    if (unknown === null) return false
    if (!testUtil.isObjectWithStringSignature(unknown)) return false
    const ok = unknown['ok']
    if (typeof ok !== 'boolean') return false
    if (ok === false) if (unknown['error'] === undefined) return false
    if (ok === true) if (unknown['result'] === undefined) return false
    if (Object.keys(unknown).length !== 2) return false
    return true
  },

  isObjectWithStringSignature(unknown: object): unknown is Record<string, unknown> {
    for (const key in unknown) {
      if (typeof key !== 'string') return false
    }
    return true
  },

  arrayOfObjectsWithOptionalSignature<Obj extends Record<string, any>>(
    unknownInput: unknown
  ): (Partial<Obj>)[] {
    let output: (Partial<Obj>)[]
    output = (
      Array.isArray(unknownInput)
      && unknownInput.length > 0
      && unknownInput.every((val) => (typeof val === 'object' && val !== null))
    ) ? unknownInput as (Partial<Obj>)[] : [{}]
    return output
  },

  async sendFetchRequest(
    fetchReq: FetchReqI
  ): Promise<ResultObligtryI<unknown>> {
    const { reqTxt, method, headers, bodyObj, descrip }: FetchReqI = fetchReq

    let init: RequestInit | undefined
    if (method || bodyObj || headers) {
      init = {}
      if (method) init.method = method
      if (headers) init.headers = headers
      if (bodyObj) init.body = JSON.stringify(bodyObj)
    }

    const response = await fetch(reqTxt, init)
    let result: unknown
    if (response.ok) { result = await response.json() }

    const ftechReqForTxt: FetchReqI = { reqTxt }
    if (method) ftechReqForTxt.method = method
    if (descrip) ftechReqForTxt.descrip = descrip
    console.log(testUtil.genDescripTxt(ftechReqForTxt))
    if (bodyObj !== undefined) console.log('Body:\n', bodyObj)
    if (headers !== undefined) console.log('Headers:\n', headers)
    console.log('Result:\n', result)

    if (!testUtil.isResultObligtryType(result)) return {ok: false, error: 'Incorrect return type.'}

    return result
  },

  genDescripTxt(fetchReq: FetchReqI, res?: any): string {
    let { reqTxt, method, headers, bodyObj, descrip }: FetchReqI = fetchReq
    if (!method) method = 'GET'

    let text: string = ''
    if (descrip) text += '\n' + descrip + ' '
    text += 'Fetch ' + method + ' request ' + reqTxt + '.'
    if (headers !== undefined) { text += ' Headers: ' + JSON.stringify(headers) + '.' }
    if (bodyObj !== undefined) { text += ' Body: ' + JSON.stringify(bodyObj) + '.' }
    if (res !== undefined) { text += ' Result: ' + JSON.stringify(res) + '.' }

    return text
  },

  shuffleArray<T>(array: T[]): T[] {
    // let current = array.length
    // let random: number
    // while (current > 0) {
    //   random = Math.floor(Math.random() * current);
    //   current--;
    //   [array[current], array[random]] = [array[random], array[current]];
    // }

    for (let current = array.length - 1; current > 0; current--) {
      const random = Math.floor(Math.random() * (current + 1));
      // [array[current], array[random]] = [array[random], array[current]];
      const valCurr = array[current]
      const valRand = array[random]
      if (valCurr !== undefined && valRand !== undefined) {
        array[random] = valCurr
        array[current] = valRand
      }
    }
    return array;
  }
})
