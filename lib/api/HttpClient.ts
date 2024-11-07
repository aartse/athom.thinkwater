'use strict';

import Homey from 'homey/lib/Homey';
import https from 'https';
import UnauthorizedError from '../types/error/UnauthorizedError';

export default class HttpClient {

    homey: Homey;
    hostname: string;
    authToken: string = '';

    constructor(homey: Homey, hostname: string) {
        this.homey = homey;
        this.hostname = hostname;
    }

    doRequest(path: string, method: string, data?: any) : Promise <string> {
        return new Promise((resolve, reject) => {
            const options: any = {
                method: method,
                hostname: this.hostname,
                port: 443,
                path: path,
                headers: {
                    'Accept': 'application/json',
                },
                maxRedirects: 5,
                rejectUnauthorized: false,
                timeout: 5000,
            };

            if (this.authToken !== '') {
                options.headers['Authorization'] = ' Bearer '+this.authToken;
            }

            var body = null;
            if (data) {
                body = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(body);
            }
    
            const req = https.request(options, res => {
                const statusCode = res.statusCode || 0;
                if (statusCode === 401) {
                    this.authToken = '';

                    return reject(new UnauthorizedError(`Failed to ${method} to url: ${options.path} (status code: 401)`));
                }

                const data: string[] = [];
                res.on('data', chunk => data.push(chunk));

                res.on('end', () => {
                    if (statusCode < 200 || statusCode >= 300) {
                        return reject({
                            statusCode: statusCode,
                            message: `Failed to ${method} to url: ${options.path} (status code: ${statusCode})`,
                            data: data.join('')
                        });
                    } else {
                        return resolve(data.join(''));
                    }
                });
            });

            req.on('error', error => {
                this.homey.error(error)

                reject({
                    statusCode: 0,
                    message: error
                })
            })

            if (null !== body) {
                req.write(body);
            }
            req.end();
        });
    }
}