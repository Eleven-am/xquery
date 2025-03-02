import {
    ActionRecord,
    InferActionRecord, InferInfiniteRecord,
    InferMutationRecord,
    InferQueryRecord, InfiniteRecord,
    QueryFactoryOptions,
    QueryRecord,
    MutationRecord,
} from "./types";
import {buildActionOptions, buildInfiniteOptions, buildMutationOptions, buildQueryKey} from "./queryBuilders";

export function queryFactory<TClient, TError> ({ clientGetter, mapResponse, queryClientGetter }: QueryFactoryOptions<TClient, TError>) {
    function createQueries<
        TNamespace extends string,
        TRecord extends QueryRecord<TClient, TError>
    > (
        namespace: TNamespace,
        definition: TRecord,
    ): InferQueryRecord<TRecord, TNamespace, TClient, TError> {
        const result = {
        } as any;

        result.all = {
            queryKey: [namespace],
        };

        for (const [key, value] of Object.entries(definition)) {
            if (typeof value === 'function') {
                result[key] = (...params: any[]) => buildQueryKey(namespace, key, clientGetter, mapResponse, value(...params));
            } else {
                result[key] = buildQueryKey(namespace, key, clientGetter, mapResponse, value);
            }
        }

        return result;
    }

    function createMutations<TRecord extends MutationRecord<TClient, TError>, TError> (
        definition: TRecord,
    ): InferMutationRecord<TRecord, TClient, TError> {
        const result = {
        } as InferMutationRecord<TRecord, TClient, TError>;

        for (const [key, value] of Object.entries(definition)) {
            if (typeof value === 'function') {
                result[key as keyof TRecord] = ((...params: any[]) => buildMutationOptions(queryClientGetter, clientGetter, mapResponse, value(...params) as any)) as any;
            } else {
                result[key as keyof TRecord] = buildMutationOptions(queryClientGetter, clientGetter, mapResponse, value as any) as any;
            }
        }

        return result;
    }

    function createActions<
        TNamespace extends string,
        TRecord extends ActionRecord<TClient, TError>
    > (
        namespace: TNamespace,
        definition: TRecord,
    ): InferActionRecord<TRecord, TNamespace, TClient, TError> {
        const result = {
        } as any;

        result.all = {
            queryKey: [namespace],
        };

        for (const [key, value] of Object.entries(definition)) {
            if (typeof value === 'function') {
                result[key] = (...params: any[]) => buildActionOptions(namespace, key, queryClientGetter, clientGetter, mapResponse, value(...params) as any);
            } else {
                result[key] = buildActionOptions(namespace, key, queryClientGetter, clientGetter, mapResponse, value as any);
            }
        }

        return result;
    }

    function createInfiniteQueries<
        TNamespace extends string,
        TRecord extends InfiniteRecord<TClient, TError>
    > (
        namespace: TNamespace,
        definition: TRecord,
    ): InferInfiniteRecord<TNamespace, TRecord, TClient, TError> {
        const result = {
        } as any;

        result.all = {
            queryKey: [namespace],
        };

        for (const [key, value] of Object.entries(definition)) {
            if (typeof value === 'function') {
                result[key] = (...params: any[]) => buildInfiniteOptions(namespace, key, queryClientGetter, clientGetter, mapResponse, value(...params));
            } else {
                result[key] = buildInfiniteOptions(namespace, key, queryClientGetter, clientGetter, mapResponse, value);
            }
        }

        return result;
    }

    return {
        createQueries,
        createMutations,
        createActions,
        createInfiniteQueries,
    };
}
