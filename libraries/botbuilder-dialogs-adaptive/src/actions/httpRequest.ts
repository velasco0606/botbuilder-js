/**
 * @module botbuilder-dialogs-adaptive
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogTurnResult, DialogConfiguration, DialogContext, Dialog } from 'botbuilder-dialogs';
import { ExpressionProperty, ExpressionPropertyValue } from '../expressionProperty';
import fetch, * as request from "node-fetch";
import { Activity } from 'botbuilder-core';
import * as stringTemplate from '../stringTemplate';

export interface HttpRequestConfiguration extends DialogConfiguration {

    method?: HttpMethod;

    valueType?: string;

    url?: string;

    headers?: object;

    body?: object;

    responseType?: ResponsesTypes;

    resultProperty?: string;
}

export enum ResponsesTypes {
    /**
     * No response expected
     */
    None,

    /**
     * Plain JSON response
     */
    Json,

    /**
     * JSON Activity object to send to the user
     */
    Activity,

    /**
     * Json Array of activity objects to send to the user
     */
    Activities
}

export enum HttpMethod {
    /**
     * Http GET
     */
    GET = "GET",

    /**
     * Http POST
     */
    POST = "POST",

    /**
     * Http PATCH
     */
    PATCH = "PATCH",

    /**
     * Http PUT
     */
    PUT = "PUT",

    /**
     * Http DELETE
     */
    DELETE = "DELETE"
}

export class HttpRequest<O extends object = {}> extends Dialog<O> {

    /**
     * Http Method
     */
    public method?: HttpMethod;

    /**
     * Http Url
     */
    public url?: string;

    /**
     * Http Headers
     */
    public headers?: object;
    /**
     * Http Body
     */
    public body?: object;

    /**
     * The response type of the response
     */
    public responseType?: ResponsesTypes;

    /**
     * Gets or sets the property expression to store the HTTP response in.
     */
    public resultProperty?: string;

    constructor();
    constructor(method: HttpMethod, url: string, headers: object,
        body: object,
        responseType: ResponsesTypes, resultProperty: string);
    constructor(method?: HttpMethod, url?: string, headers?: object,
        body?: object,
        responseType?: ResponsesTypes, resultProperty?: string) {
        super();
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.body = body;
        if (responseType) {
            this.responseType = responseType;
        }
        else {
            this.responseType = ResponsesTypes.Json;
        }
        this.resultProperty = resultProperty;
    }

    protected onComputeId(): string {
        return `HttpRequest[${this.method} ${this.url}]`;
    }

    public configure(config: HttpRequestConfiguration): this {
        return super.configure(config);
    }

    public async beginDialog(dc: DialogContext): Promise<DialogTurnResult> {

        /**
         * TODO: replace the key value pair in json recursively
         */

        const url = stringTemplate.format(this.url, dc);
        const headers = this.headers;

        const instanceBody = this.ReplaceBodyRecursively(dc, this.body);

        const parsedBody = JSON.stringify(instanceBody);
        const parsedHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers);

        let response: any;

        switch (this.method) {
            case HttpMethod.DELETE:
            case HttpMethod.GET:
                response = await fetch(url, {
                    method: this.method.toString(),
                    headers: parsedHeaders,
                });
                break;
            case HttpMethod.PUT:
            case HttpMethod.PATCH:
            case HttpMethod.POST:
                response = await fetch(url, {
                    method: this.method.toString(),
                    headers: parsedHeaders,
                    body: parsedBody,
                });
                break;
        }

        const jsonResult = await response.json();

        let result: Result = {
            headers: headers,
            statusCode: response.status,
            reasonPhrase: response.statusText
        };

        switch (this.responseType) {
            case ResponsesTypes.Activity:
                result.content = jsonResult;
                dc.context.sendActivity(jsonResult as Activity);
                break;
            case ResponsesTypes.Activities:
                result.content = jsonResult;
                dc.context.sendActivities(jsonResult as Activity[]);
                break;
            case ResponsesTypes.Json:
                result.content = jsonResult;
                break;
            case ResponsesTypes.None:
            default:
                break;
        }

        if (this.resultProperty) {
            dc.state.setValue(this.resultProperty, result);
        }

        return await dc.endDialog(result);
    }

    private ReplaceBodyRecursively(dc: DialogContext, unit: object) {
        if (typeof unit === 'string') {
            let text: string = unit as string;
            if (text.startsWith('{') && text.endsWith('}')) {
                text = text.slice(1, text.length - 1);
                return new ExpressionProperty(text).evaluate(this.id, dc.state);
            }
            else {
                return stringTemplate.format(text, dc);
            }
        }

        if (Array.isArray(unit)) {
            let result = [];
            unit.forEach(child => {
                result.push(this.ReplaceBodyRecursively(dc, child));
            })
            return result;
        }

        if (typeof unit === 'object') {
            let result = {};
            for (let key in unit) {
                result[key] = this.ReplaceBodyRecursively(dc, unit[key]);
            }
            return result;
        }

        return unit;
    }
}

export class Result {
    public statusCode?: Number;

    public reasonPhrase?: string;

    public headers?: any;

    public content?: object;
}