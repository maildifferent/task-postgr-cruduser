
import { FetchRequestI, list_names, FetchResultI, testUtil } from './test_util.js';
import '/pub/chai.js';
import '/pub/mocha.js';


const assert = chai.assert;
mocha.setup('bdd');

(async () => {
  await main()
  mocha.run()
})()

async function main(): Promise<void> {
  //////////////////////////////////////////////////////////////////////////////
  // Init.
  //////////////////////////////////////////////////////////////////////////////
  let fetchRequest: FetchRequestI
  let fetchResult: FetchResultI<unknown>
  // const url = 'http://localhost:8080'
  // const url = 'https://maildif-task-postgr-cruduser.herokuapp.com'
  const url = 'https://maildif-task-postgr-cruduser.onrender.com'
  //
  testUtil.shuffleArray(list_names)

  //////////////////////////////////////////////////////////////////////////////
  // Signin.
  //////////////////////////////////////////////////////////////////////////////
  const testSigninBody = (() => {
    let name: string = list_names.pop() || 'someText'
    name += Math.floor(Math.random() * 900) + 100
    return {
      data: {
        email: name + '@exe.com',
        password: 'Example1',
        nickname: name
      }
    }
  })()
  //
  const testSigninResult = await (async () => {
    fetchRequest = {
      reqTxt: url + '/api/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyObj: testSigninBody,
      descrip: '<< SIGNIN >>'
    }
    // {"token": "eyJhbGciOiJIUzI1NiI...","expire": "2022-09-26T12:38:31.873Z"}
    fetchResult = await testUtil.sendFetchRequest(fetchRequest)
    // Tests.
    let result: any
    if (!fetchResult.ok) { result = undefined } else { result = fetchResult.result }
    describe(testUtil.genDescripTxt(fetchRequest, fetchResult), () => {
      it('typeof result === object && result !== null', () => {
        assert.strictEqual(typeof result, 'object')
        assert.notStrictEqual(result, null)
      })
      //  
      it('Object.keys(result).length === 2', () => {
        assert.strictEqual(Object.keys(result).length, 2)
      })
      //
      it('typeof result.token === string', () => {
        assert.strictEqual(typeof result.token, 'string')
      })
      //
      it('typeof result.expire === string', () => {
        assert.strictEqual(typeof result.expire, 'string')
      })
    })
    // Return.
    if (!result) result = {}
    return result as Partial<{ token: string, expire: string }>
  })()
  testSigninResult

  //////////////////////////////////////////////////////////////////////////////
  // Create users.
  //////////////////////////////////////////////////////////////////////////////
  const testCreateUsersBody = (() => {
    const create: { email: string, password: string, nickname: string }[] = []
    for (let i = 0; i < 2; i++) {
      let name: string = list_names.pop() || 'someText'
      name += Math.floor(Math.random() * 900) + 100
      create.push({
        email: name + '@exe.com',
        password: 'Example1',
        nickname: name,
      })
    }
    return { create, project: { uid: true, email: true, nickname: true } }
  })()
  //
  const testCreateUsersResult = await (async () => {
    fetchRequest = {
      reqTxt: url + '/api/user',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + testSigninResult.token,
        'Content-Type': 'application/json'
      },
      bodyObj: testCreateUsersBody,
      descrip: '<< CREATE 2 USERS >>'
    }
    // [{"uid": "a91f8fa8-...", "email": "example21@exe.com", "nickname": "nickname21"}]
    fetchResult = await testUtil.sendFetchRequest(fetchRequest)
    // Tests.
    let result: any
    if (!fetchResult.ok) { result = undefined } else { result = fetchResult.result }
    describe(testUtil.genDescripTxt(fetchRequest, result), () => {
      it('Array.isArray(result) === true', () => {
        assert.strictEqual(Array.isArray(result), true)
      })
      //  
      it('result.length === 2', () => {
        assert.strictEqual(result.length, 2)
      })
      //
      it('result.every((user) => Object.keys(user).length === 3)', () => {
        assert.strictEqual(result.every((user: any) => Object.keys(user).length === 3), true)
      })
    })
    // Return.
    if (!result) result = [{}]
    return result as Partial<{ uid: string, email: string, nickname: string }>[]
  })()
  testCreateUsersResult

  //////////////////////////////////////////////////////////////////////////////
  // Read user by parameter in a link.
  //////////////////////////////////////////////////////////////////////////////
  const testReadUserByParamResult = await (async () => {
    let email: string = ''
    let nick: string = ''
    if (Array.isArray(testCreateUsersResult) && testCreateUsersResult.length > 0) {
      email = testCreateUsersResult[0]?.email || ''
      nick = testCreateUsersResult[0]?.nickname || ''
    }
    fetchRequest = {
      reqTxt: url + '/api/user/' + email,
      // reqTxt: url + '/api/user?email=dax437@exe.com',
      headers: {
        'Authorization': 'Bearer ' + testSigninResult.token
      },
      descrip: '<< READ USER BY PARAM >>'
    }
    // [{"uid": "a91f8fa8-...", "email": "example21@exe.com", "nickname": "nickname21"}]
    fetchResult = await testUtil.sendFetchRequest(fetchRequest)
    // Tests.
    let result: any
    if (!fetchResult.ok) { result = undefined } else { result = fetchResult.result }
    describe(testUtil.genDescripTxt(fetchRequest, fetchResult), () => {
      let user0: Partial<{ uid: string, email: string, nickname: string }> = {}
      if (Array.isArray(result) && result.length > 0) {
        user0 = result[0]
      }
      //
      it('Array.isArray(result) === true', () => {
        assert.strictEqual(Array.isArray(result), true)
      })
      //
      it('result.length === 1', () => {
        assert.strictEqual(result.length, 1)
      })
      //
      it('Object.keys(user0).length === 3', () => {
        assert.strictEqual(Object.keys(user0).length, 3)
      })
      //
      it('typeof user0.uid === string', () => {
        assert.strictEqual(typeof user0.uid, 'string')
      })
      //
      it('user0.email === ' + email.toLowerCase(), () => {
        assert.strictEqual(user0.email, email.toLowerCase())
      })
      //
      it('user0.nickname = ' + nick, () => {
        assert.strictEqual(user0.nickname, nick)
      })
    })
    // Return.
    if (!result) result = [{}]
    return result as Partial<{ uid: string, email: string, nickname: string }>[]
  })()
  testReadUserByParamResult

  //////////////////////////////////////////////////////////////////////////////
  // Cleanup: Delete created users.
  //////////////////////////////////////////////////////////////////////////////
  const testDeleteUsersBody = (() => {
    const emails: string[] = []
    emails.push(testSigninBody.data.email)
    for (const user of testCreateUsersResult) {
      const email = user['email']
      if (email) emails.push(email)
    }
    return {
      filter: { email: { $in: emails } },
      project: { uid: true, email: true, nickname: true }
    }
  })()
  //
  const testDeleteUsersResult = await (async () => {
    fetchRequest = {
      reqTxt: url + '/api/user',
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + testSigninResult.token,
        'Content-Type': 'application/json'
      },
      bodyObj: testDeleteUsersBody,
      descrip: '<< DELETE ALL CREATED USERS >>'
    }
    // [{"uid": "a91f8fa8-...", "email": "example21@exe.com", "nickname": "nickname21"}]
    fetchResult = await testUtil.sendFetchRequest(fetchRequest)
    // Tests.
    let result: any
    if (!fetchResult.ok) { result = undefined } else { result = fetchResult.result }
    describe(testUtil.genDescripTxt(fetchRequest, result), () => {
      it('Array.isArray(result) === true', () => {
        assert.strictEqual(Array.isArray(result), true)
      })
      //  
      it('result.length === 3', () => {
        assert.strictEqual(result.length, 3)
      })
      //
      it('result.every((user) => Object.keys(user).length === 3)', () => {
        assert.strictEqual(result.every((user: any) => Object.keys(user).length === 3), true)
      })
    })
    // Return.
    if (!result) result = [{}]
    return result as Partial<{ uid: string, email: string, nickname: string }>[]
  })()
  testDeleteUsersResult

  //////////////////////////////////////////////////////////////////////////////
  // ...
  //////////////////////////////////////////////////////////////////////////////
}
