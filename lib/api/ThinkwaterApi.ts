'use strict'

import Homey from 'homey/lib/Homey'
import HttpClient from './HttpClient'
import AuthLoginRequestInterface from '../types/api/AuthLoginRequestInterface'
import AuthLoginResponseInterface from '../types/api/AuthLoginResponseInterface'
import UserDeviceResponseInterface from '../types/api/UserDeviceResponseInterface'
import TroubleshootingSolveRequestInterface from '../types/api/TroubleshootingSolveRequestInterface'
import TroubleshootingSolveResponseInterface from '../types/api/TroubleshootingSolveResponseInterface'
import UnauthorizedError from '../types/error/UnauthorizedError'

let thinkwaterApi: ThinkwaterApi|null = null;

export default class ThinkwaterApi {

    homey: Homey
    httpClient: HttpClient
    username?: string
    password?: string

    constructor(homey: Homey) {
        this.homey = homey
        this.httpClient = new HttpClient(homey, 'cloud.thinkwater.com')

        const onSettingsChange = (field: any) => {
            if ('username' === field) {
                this.username = homey.settings.get('username')
                this.httpClient.authToken = '';
            }
            if ('password' === field) {
                this.password = homey.settings.get('password')
                this.httpClient.authToken = '';
            }
        }

        homey.settings.on('set', onSettingsChange)
        this.username = homey.settings.get('username')
        this.password = homey.settings.get('password')
    }
    
    static create(homey: Homey) {
        if (null === thinkwaterApi) {
            thinkwaterApi = new ThinkwaterApi(homey);
        }

        return thinkwaterApi;
    }

    getUserDevices() : Promise <UserDeviceResponseInterface[]> {
        return this.doRequest('/api/user-device', 'GET')
    }

    doTroubleshootingSolve(data: TroubleshootingSolveRequestInterface) : Promise <TroubleshootingSolveResponseInterface> {
        return this.doRequest('/api/troubleshooting/solve', 'PATCH', data)
    }

    private doRequest(path: string, method: string, data?: any) : Promise<any> {
        return this.fetchToken()
            .then(() => {
                this.homey.log('---- sending request to API ----')
                this.homey.log('path: '+path)
                this.homey.log('method: '+method)
                this.homey.log('data send: '+JSON.stringify(data))

                return this.httpClient.doRequest(path, method, data)
                    .then(response => {
                        this.homey.log('data received: '+response)

                        if (null === response || '' === response) {
                            return null;
                        }

                        return JSON.parse(response)
                    })
                    .catch(error =>  {
                        this.homey.error(error)

                        throw error
                    })
            })
            .catch((error) => {
                if (error instanceof UnauthorizedError) {
                    throw new Error(this.homey.__('error.credentials_invalid'));
                }

                throw error;
            })
    }

    private fetchToken() : Promise<boolean> {
        return new Promise((resolve, reject) => {

            // check if http client has aleady a token
            if (this.httpClient.authToken) {
                return resolve(true)
            }
            
            // check if username and password are set
            if (!this.username || !this.password) {
                return reject(new Error(this.homey.__('error.credentials_not_set')))
            }

            // make request data
            var data = <AuthLoginRequestInterface> {
                username: this.username,
                password: this.password,
            }

            // do login
            this.homey.log('login to API')
            this.httpClient.doRequest('/api/auth/login', 'POST', data)
                .then(response => {
                    let result = <AuthLoginResponseInterface> JSON.parse(response)
                    if (result) {
                        this.httpClient.authToken = result.authToken
                        this.homey.log('login succesful')

                        return resolve(true)
                    }

                    return reject(new Error('Error while logging in.'))
                })
                .catch(error => {
                    this.homey.error(error)

                    reject(error)
                })
        })
    }
}