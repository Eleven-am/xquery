import {Ref} from 'react';

import {InfiniteData, QueryKey} from '@tanstack/query-core';
import {
    DefinedInitialDataOptions,
    DefinedUseQueryResult, QueryClient,
    UndefinedInitialDataOptions,
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
    UseSuspenseQueryOptions,
    UseSuspenseQueryResult
} from '@tanstack/react-query';

export interface QueryResponse<TData, TError> {
    data: TData;
    error: TError;
}

export type BaseSuspenseQueryOptions<TData, TError, TQueryKey extends QueryKey> = Omit<
    UseSuspenseQueryOptions<TData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
>;

export type BaseRegularQueryOptions<TData, TError, TQueryKey extends QueryKey> = Omit<
    UseQueryOptions<TData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
>;

export type CombinedQueryOptions<TData, TError, TQueryKey extends QueryKey> =
    & BaseRegularQueryOptions<TData, TError, TQueryKey>
    & BaseSuspenseQueryOptions<TData, TError, TQueryKey>;

export type BaseQueryConfig<TData, TError, TQueryKey extends QueryKey = QueryKey> =
    CombinedQueryOptions<TData, TError, TQueryKey> & {
    queryKey?: TQueryKey;
    toastError?: boolean;
};

export type DefinedQueryDef<TData, TError, TClient, TQueryKey extends QueryKey = QueryKey> =
    BaseQueryConfig<TData, TError, TQueryKey> & {
    initialData: TData | (() => TData);
    queryFn: (client: TClient) => Promise<QueryResponse<TData, TError>>;
};

export type UndefinedQueryDef<TData, TError, TClient, TQueryKey extends QueryKey = QueryKey> =
    BaseQueryConfig<TData, TError, TQueryKey> & {
    initialData?: undefined;
    queryFn: (api: TClient) => Promise<QueryResponse<TData, TError>>;
};

export type ParamDefinedQueryDef<TParams extends any[], TData, TError, TClient, TQueryKey extends QueryKey = QueryKey> =
    (...params: TParams) => DefinedQueryDef<TData, TError, TClient, TQueryKey>;

export type ParamUndefinedQueryDef<TParams extends any[], TData, TError, TClient, TQueryKey extends QueryKey = QueryKey> =
    (...params: TParams) => UndefinedQueryDef<TData, TError, TClient, TQueryKey>;

export type QueryRecord<TClient, TError> = Record<string,
    | DefinedQueryDef<any, TError, TClient>
    | UndefinedQueryDef<any, TError, TClient>
    | ParamDefinedQueryDef<any[], any, TError, TClient>
    | ParamUndefinedQueryDef<any[], any, TError, TClient>
>;

export type InferQueryResult<TDef, TClient, TError, TQueryKey extends QueryKey> =
    TDef extends DefinedQueryDef<infer TData, TError, TClient, TQueryKey>
        ? DefinedInitialDataOptions<TData, TError, TData, TQueryKey> &
        UseSuspenseQueryOptions<TData, TError, TData, TQueryKey>
        : TDef extends UndefinedQueryDef<infer TData, TError, TClient, TQueryKey>
            ? UndefinedInitialDataOptions<TData, TError, TData, TQueryKey> &
            UseSuspenseQueryOptions<TData, TError, TData, TQueryKey>
            : never;

export type InferQueryRecord<T extends QueryRecord<TClient, TError>, TNamespace extends string, TClient, TError> = {
    [K in keyof T]: T[K] extends ParamDefinedQueryDef<infer Args, infer Result, TError, TClient>
        ? (...args: Args) => DefinedInitialDataOptions<Result, TError, Result, [TNamespace, K, ...Args]> &
            UseSuspenseQueryOptions<Result, TError, Result, [TNamespace, K, ...Args]>
        : T[K] extends ParamUndefinedQueryDef<infer Args, infer Result, TError, TClient>
            ? (...args: Args) => UndefinedInitialDataOptions<Result, TError, Result, [TNamespace, K, ...Args]> &
                UseSuspenseQueryOptions<Result, TError, Result, [TNamespace, K, ...Args]>
            : T[K] extends DefinedQueryDef<infer Result, TError, TClient>
                ? DefinedInitialDataOptions<Result, TError, Result, [TNamespace, K]> &
                UseSuspenseQueryOptions<Result, TError, Result, [TNamespace, K]>
                : T[K] extends UndefinedQueryDef<infer Result, TError, TClient>
                    ? UndefinedInitialDataOptions<Result, TError, Result, [TNamespace, K]> &
                    UseSuspenseQueryOptions<Result, TError, Result, [TNamespace, K]>
                    : never;
} & {
    all: { queryKey: [TNamespace] };
};

export type BaseMutationConfig<TData, TError, TVariables> = Omit<
    UseMutationOptions<TData, TError, TVariables>,
    'mutationFn'
> & {
    toastError?: boolean;
    invalidateKeys?: QueryKey[];
};

export type MutationDef<TData, TError, TVariables, TClient> = BaseMutationConfig<TData, TError, TVariables> & {
    mutationFn: (api: TClient, variables: TVariables) => Promise<QueryResponse<TData, TError>>;
};

export type ParamMutationDef<TParams extends any[], TData, TError, TVariables, TClient> =
    (...params: TParams) => MutationDef<TData, TError, TVariables, TClient>;

export type MutationRecord<TClient, TError> = Record<string,
    | MutationDef<any, TError, any, TClient>
    | ParamMutationDef<any[], any, TError, any, TClient>
>;

export type InferMutationOptions<TDef, TClient, TError> =
    TDef extends MutationDef<infer TData, TError, infer TVariables, TClient>
        ? UseMutationOptions<TData, TError, TVariables>
        : never;

export type InferMutationRecord<T extends MutationRecord<TClient, TError>, TClient, TError> = {
    [K in keyof T]: T[K] extends ParamMutationDef<infer TParams, infer TData, TError, infer TVariables, TClient>
        ? (...params: TParams) => UseMutationOptions<TData, TError, TVariables>
        : T[K] extends MutationDef<infer TData, TError, infer TVariables, TClient>
            ? UseMutationOptions<TData, TError, TVariables>
            : never;
};

export type BaseActionConfig<TQueryData, TVariables, TClient, TError, TMutationData = TQueryData, TQueryKey extends QueryKey = QueryKey> =
    {
        queryKey?: TQueryKey;
        toastError?: boolean;
        invalidateKeys?: QueryKey[];
        onQuerySuccess?: (data: TQueryData) => void;
        queryFn: (api: TClient, variables?: TMutationData) => Promise<QueryResponse<TQueryData, TError>>;
        mutationFn: (api: TClient, variables: TVariables) => Promise<QueryResponse<TMutationData, TError>>;
    }
    & Omit<UseQueryOptions<TQueryData, TError, TQueryData, TQueryKey>, 'queryKey' | 'queryFn'>
    &
    Omit<UseMutationOptions<TMutationData, TError, TVariables>, 'mutationFn'>;

export type DefinedActionDef<TQueryData, TVariables, TClient, TError, TMutationData = TQueryData, TQueryKey extends QueryKey = QueryKey> =
    BaseActionConfig<TQueryData, TVariables, TClient, TError, TMutationData, TQueryKey> & {
    initialData: TQueryData | (() => TQueryData);
};

export type UndefinedActionDef<TQueryData, TVariables, TClient, TError, TMutationData = TQueryData, TQueryKey extends QueryKey = QueryKey> =
    BaseActionConfig<TQueryData, TVariables, TClient, TError, TMutationData, TQueryKey> & {
    initialData?: undefined;
};

export type ParamDefinedActionDef<TParams extends any[], TQueryData, TVariables, TClient, TError, TMutationData = TQueryData, TQueryKey extends QueryKey = QueryKey> =
    (...params: TParams) => DefinedActionDef<TQueryData, TVariables, TClient, TError, TMutationData, TQueryKey>;

export type ParamUndefinedActionDef<TParams extends any[], TQueryData, TVariables, TClient, TError, TMutationData = TQueryData, TQueryKey extends QueryKey = QueryKey> =
    (...params: TParams) => UndefinedActionDef<TQueryData, TVariables, TClient, TError, TMutationData, TQueryKey>;

export type BaseActionOptions<TQueryData, TVariables, QueryOptions, TError, TMutationData = TQueryData> = {
    mutateOptions: UseMutationOptions<TMutationData, TError, TVariables>;
    queryOptions: QueryOptions;
    queryClientGetter: QueryClientGetter;
}

export type ActionRecord<TClient, TError> = Record<string,
    | DefinedActionDef<any, any, TClient, TError, any>
    | UndefinedActionDef<any, any, TClient, TError, any>
    | ParamDefinedActionDef<any[], any, any, TClient, TError>
    | ParamUndefinedActionDef<any[], any, any, TClient, TError>
>;

export type InferActionRecord<T extends ActionRecord<TClient, TError>, TNamespace extends string, TClient, TError> = {
    [K in keyof T]: T[K] extends ParamDefinedActionDef<infer Args, infer Result, infer Variables, TClient, TError, infer MData, infer QueryKey>
        ? (...args: Args) => BaseActionOptions<Result, Variables, DefinedInitialDataOptions<Result, TError, Result, QueryKey>, TError, MData>
        : T[K] extends ParamUndefinedActionDef<infer Args, infer Result, infer Variables, TClient, TError, infer MData, infer QueryKey>
            ? (...args: Args) => BaseActionOptions<Result, Variables, UndefinedInitialDataOptions<Result, TError, Result, QueryKey>, TError, MData>
            : T[K] extends DefinedActionDef<infer Result, infer Variables, TClient, TError, infer MData, infer QueryKey>
                ? BaseActionOptions<Result, Variables, DefinedInitialDataOptions<Result, TError, Result, QueryKey>, TError, MData>
                : T[K] extends UndefinedActionDef<infer Result, infer Variables, TClient, TError, infer MData, infer QueryKey>
                    ? BaseActionOptions<Result, Variables, UndefinedInitialDataOptions<Result, TError, Result, QueryKey>, TError, MData>
                    : never;
} & {
    all: { queryKey: [TNamespace] };
};

export type BaseActionResult<TData, TVariables, MData, TError, QueryOptions> =
    Omit<UseMutationResult<MData, TError, TVariables>, 'data'> &
    UseSuspenseQueryResult<TData, TError>
    & QueryOptions;

export type DefinedActionResult<TData, MData, TVariables, TError> =
    BaseActionResult<TData, TVariables, MData, TError, DefinedUseQueryResult<TData, TError>>;

export type UndefinedActionResult<TData, MData, TVariables, TError> =
    BaseActionResult<TData, TVariables, MData, TError, UseQueryResult<TData, TError>>;

export interface PageResponse<T> {
    page: number;
    totalPages: number;
    totalResults: number;
    results: T[];
}

export interface BaseInfiniteOptions<DataType, TQueryKey extends QueryKey, TClient, TError> {
    enabled?: boolean;
    queryKey?: TQueryKey;
    toastError?: boolean;
    queryFn: (action: TClient, page: number) => Promise<QueryResponse<PageResponse<DataType>, TError>>;
    initialData?: PageResponse<DataType>;
}

export type BaseInfiniteResult<DataType, TQueryKey extends QueryKey = QueryKey> = {
    enabled?: boolean;
    queryKey: TQueryKey;
    initialPageParam: number;
    queryFn: ({pageParam}: { pageParam?: number }) => Promise<PageResponse<DataType>>;
    getNextPageParam: (data: PageResponse<DataType>) => number | null;
}

export type UseInfiniteScrollReturn<DataType> = [DataType[], Ref<HTMLDivElement>];

export interface UseInfiniteScrollOptions<DataType, TQueryKey extends QueryKey = QueryKey> extends BaseInfiniteResult<DataType, TQueryKey> {
    initialData?: InfiniteData<PageResponse<DataType>, number>;
    options?: IntersectionObserverInit;
    queryClientGetter: QueryClientGetter;
}

export type InfiniteFnDef<Params extends unknown[], DataType, TQueryKey extends QueryKey, TClient, TError> =
    (...args: Params) => BaseInfiniteOptions<DataType, TQueryKey, TClient, TError>;

export type InfiniteRecord<TClient, TError> = {
    [key: string]: InfiniteFnDef<any[], any, QueryKey, TClient, TError> | BaseInfiniteOptions<any, QueryKey, TClient, TError>;
}

export type InferInfiniteRecord<TNamespace extends string, T extends InfiniteRecord<TClient, TError>, TClient, TError> = {
    [K in keyof T]: T[K] extends InfiniteFnDef<infer Params, infer DataType, infer TQueryKey, TClient, TError>
        ? (...params: Params) => UseInfiniteScrollOptions<DataType, [TNamespace, K, ...TQueryKey]>
        : T[K] extends BaseInfiniteOptions<infer DataType, infer TQueryKey, TClient, TError>
            ? UseInfiniteScrollOptions<DataType, [TNamespace, K, ...TQueryKey]>
            : never;
} & {
    all: { queryKey: [TNamespace] };
};

export type QueryClientGetter = () => QueryClient;
export type GetClientInstance<TClient> = (signal?: AbortSignal) => TClient;
export type MapQueryKeyFn<TQueryKey extends QueryKey = QueryKey> = (queryKey: TQueryKey) => TQueryKey;
export type ErrorMapperFn<TError> = (shouldToast: boolean) => <Data>(response: QueryResponse<Data, TError>) => Data;

export interface QueryFactoryOptions<TClient, TError> {
    queryClientGetter: QueryClientGetter;
    clientGetter: GetClientInstance<TClient>;
    mapQueryKey?: MapQueryKeyFn;
    mapResponse: (shouldToast: boolean) => <Data>(response: QueryResponse<Data, TError>) => Data;
}

export interface UseAutoSaveActionOptions<TData, TError, TQueryKey extends QueryKey> {
    delay: number;
    options: BaseActionOptions<TData, TData, DefinedInitialDataOptions<TData, TError, TData, TQueryKey>, TError, TData>;
}

