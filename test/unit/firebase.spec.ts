/*!
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Use untyped import syntax for Node built-ins
import path = require('path');

import * as _ from 'lodash';
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import * as mocks from '../resources/mocks';

import * as firebaseAdmin from '../../src/index';
import {ApplicationDefaultCredential, CertCredential, RefreshTokenCredential} from '../../src/auth/credential';

chai.should();
chai.use(chaiAsPromised);

const expect = chai.expect;


describe('Firebase', () => {
  let getTokenStub: sinon.SinonStub;

  before(() => {
    getTokenStub = sinon.stub(CertCredential.prototype, 'getAccessToken').resolves({
      access_token: 'mock-access-token',
      expires_in: 3600,
    });
  });

  after(() => {
    getTokenStub.restore();
  });

  afterEach(() => {
    const deletePromises: Array<Promise<void>> = [];
    firebaseAdmin.apps.forEach((app) => {
      deletePromises.push(app.delete());
    });

    return Promise.all(deletePromises);
  });

  describe('#initializeApp()', () => {
    const invalidOptions: any[] = [null, NaN, 0, 1, true, false, '', 'a', [], _.noop];
    invalidOptions.forEach((invalidOption: any) => {
      it('should throw given invalid options object: ' + JSON.stringify(invalidOption), () => {
        expect(() => {
          firebaseAdmin.initializeApp(invalidOption);
        }).to.throw('Invalid Firebase app options');
      });
    });

    it('should use application default credentials when no credentials are explicitly specified', () => {
      const app = firebaseAdmin.initializeApp(mocks.appOptionsNoAuth);
      expect(app.options).to.have.property('credential');
      expect(app.options.credential).to.be.instanceOf(ApplicationDefaultCredential);
    });

    it('should not modify the provided options object', () => {
      const optionsClone = _.clone(mocks.appOptions);
      firebaseAdmin.initializeApp(mocks.appOptions);
      expect(optionsClone).to.deep.equal(mocks.appOptions);
    });

    const invalidCredentials = [undefined, null, NaN, 0, 1, '', 'a', true, false, '', _.noop];
    invalidCredentials.forEach((invalidCredential) => {
      it('should throw given non-object credential: ' + JSON.stringify(invalidCredential), () => {
        expect(() => {
          firebaseAdmin.initializeApp({
            credential: invalidCredential as any,
          });
        }).to.throw('Invalid Firebase app options');
      });
    });

    it('should throw given a credential which doesn\'t implement the Credential interface', () => {
      expect(() => {
        firebaseAdmin.initializeApp({
          credential: {},
        } as any);
      }).to.throw('Invalid Firebase app options');

      expect(() => {
        firebaseAdmin.initializeApp({
          credential: {
            getAccessToken: true,
          },
        } as any);
      }).to.throw('Invalid Firebase app options');
    });

    it('should initialize SDK given a cert credential with a certificate object', () => {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(mocks.certificateObject),
      });

      return firebaseAdmin.app().INTERNAL.getToken()
        .should.eventually.have.keys(['accessToken', 'expirationTime']);
    });

    it('should initialize SDK given a cert credential with a valid path to a certificate key file', () => {
      const keyPath = path.resolve(__dirname, '../resources/mock.key.json');
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(keyPath),
      });

      return firebaseAdmin.app().INTERNAL.getToken()
        .should.eventually.have.keys(['accessToken', 'expirationTime']);
    });

    it('should initialize SDK given an application default credential', () => {
      let credPath: string;
      credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '../resources/mock.key.json');
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.applicationDefault(),
      });

      return firebaseAdmin.app().INTERNAL.getToken().then((token) => {
        if (typeof credPath === 'undefined') {
          delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        } else {
          process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
        }
        return token;
      }).should.eventually.have.keys(['accessToken', 'expirationTime']);
    });

    it('should initialize SDK given a refresh token credential', () => {
      getTokenStub.restore();
      getTokenStub = sinon.stub(RefreshTokenCredential.prototype, 'getAccessToken')
        .resolves({
          access_token: 'mock-access-token',
          expires_in: 3600,
        });
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.refreshToken(mocks.refreshToken),
      });

      return firebaseAdmin.app().INTERNAL.getToken()
        .should.eventually.have.keys(['accessToken', 'expirationTime']);
    });
  });

  describe('#auth', () => {
    it('should throw if the app has not be initialized', () => {
      expect(() => {
        return firebaseAdmin.auth();
      }).to.throw('The default Firebase app does not exist.');
    });

    it('should return the auth service', () => {
      firebaseAdmin.initializeApp(mocks.appOptions);
      expect(() => {
        return firebaseAdmin.auth();
      }).not.to.throw();
    });
  });
});
