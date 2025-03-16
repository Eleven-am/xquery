import {
    BaseActionOptions,
    BaseInfiniteOptions,
    DefinedActionDef,
    DefinedQueryDef,
    ErrorMapperFn,
    GetClientInstance,
    InferMutationOptions,
    InferQueryResult,
    MapQueryKeyFn,
    MutationDef,
    PageResponse,
    QueryClientGetter,
    QueryResponse,
    UndefinedQueryDef,
    UseInfiniteScrollOptions
} from "./types";
import type {DefinedInitialDataOptions, UseMutationOptions} from "@tanstack/react-query";
import type {InfiniteData, QueryKey} from "@tanstack/query-core";

export function buildQueryFn<TData, TError, TClient> (
    toastError: boolean,
    clientGetter: GetClientInstance<TClient>,
    errorMapper: ErrorMapperFn<TError>,
    queryFn: (client: TClient) => Promise<QueryResponse<TData, TError>>,
) {
    return ({ signal }: { signal: AbortSignal }) => queryFn(clientGetter(signal)).then(errorMapper(toastError));
}

export function buildMutationFn<TData, TError, TVariables, TClient> (
    toastError: boolean,
    clientGetter: GetClientInstance<TClient>,
    errorMapper: ErrorMapperFn<TError>,
    mutationFn: (client: TClient, variables: TVariables) => Promise<QueryResponse<TData, TError>>,
) {
    return (variables: TVariables) => mutationFn(clientGetter(), variables).then(errorMapper(toastError));
}

export function buildQueryKey <TNamespace, TError, TKey, Result, TClient> (
    namespace: TNamespace,
    key: TKey,
    mapQueryKey: MapQueryKeyFn,
    clientGetter: GetClientInstance<TClient>,
    errorMapper: ErrorMapperFn<TError>,
    options: (DefinedQueryDef<Result, TError, TClient> | UndefinedQueryDef<Result, TError, TClient>),
): InferQueryResult<typeof options, TClient, TError, [TNamespace, TKey]> {
    const toastError = options.toastError || false;
    const oldQueryKey = options.queryKey || [];
    const queryKey = mapQueryKey([namespace, key, ...oldQueryKey] as unknown as string[]);
    const queryFn = buildQueryFn(toastError, clientGetter, errorMapper, options.queryFn);

    return {
        ...options,
        queryKey,
        queryFn,
    } as unknown as InferQueryResult<typeof options, TClient, TError, [TNamespace, TKey]>;
}

export function buildMutationOptions<TData, TError, TVariables, TClient> (
    queryClient: QueryClientGetter,
    clientGetter: GetClientInstance<TClient>,
    errorMapper: ErrorMapperFn<TError>,
    options: MutationDef<TData, TError, TVariables, TClient>,
): InferMutationOptions<typeof options, TClient, TError> {
    const toastError = options.toastError ?? true;
    const invalidateKeys = options.invalidateKeys ?? [];

    const mutationFn = buildMutationFn(toastError, clientGetter, errorMapper, options.mutationFn);

    const onSuccess = async (data: TData, variables: TVariables, context: unknown) => {
        const promises = invalidateKeys.map((queryKey) => queryClient().invalidateQueries({
            queryKey,
        }));

        await Promise.all(promises);
        await options.onSuccess?.(data, variables, context);
    };

    return {
        ...options,
        mutationFn,
        onSuccess,
    } as InferMutationOptions<typeof options, TClient, TError>;
}

export function buildActionOptions<TNamespace, TKey, Result, TError, Variables, TClient> (
    namespace: TNamespace,
    key: TKey,
    mapQueryKey: MapQueryKeyFn,
    queryClient: QueryClientGetter,
    clientGetter: GetClientInstance<TClient>,
    errorMapper: ErrorMapperFn<TError>,
    options: DefinedActionDef<Result, Variables, TClient, TError>,
): BaseActionOptions<
    Result,
    Variables,
    DefinedInitialDataOptions<Result, TError, Result, [TNamespace, TKey]> | UseMutationOptions<Result, TError, Variables>,
    TError> {
    const toastError = options.toastError ?? true;
    const oldQueryKey = options.queryKey || [];
    const queryKey = mapQueryKey([namespace, key, ...oldQueryKey] as unknown as string[]);
    const keysToInvalidate = [queryKey, ...(options.invalidateKeys || [])];
    const mutationFn = buildMutationFn(toastError, clientGetter, errorMapper, options.mutationFn);
    const queryFn = buildQueryFn(toastError, clientGetter, errorMapper, options.queryFn);

    const onSuccess = async (data: Result, variables: Variables, context: unknown) => {
        const promises = keysToInvalidate.map((queryKey) => queryClient().invalidateQueries({
            queryKey,
        }));

        await Promise.all(promises);
        await options.onSuccess?.(data, variables, context);
    };

    return {
        queryClientGetter: queryClient,
        queryOptions: {
            ...options,
            queryKey,
            queryFn,
        },
        mutateOptions: {
            ...options,
            mutationFn,
            onSuccess,
        },
    } as BaseActionOptions<Result, Variables, any, TError>;
}

export function buildInfiniteOptions<DataType, TClient, TError, TQueryKey extends QueryKey> (
    namespace: string,
    propertyNamespace: string,
    mapQueryKey: MapQueryKeyFn<TQueryKey>,
    queryClient: QueryClientGetter,
    clientGetter: GetClientInstance<TClient>,
    mapResponse: ErrorMapperFn<TError>,
    property: BaseInfiniteOptions<DataType, TQueryKey, TClient, TError>,
): UseInfiniteScrollOptions<DataType, TQueryKey> {
    const oldKey = property.queryKey || [];
    const newKey = mapQueryKey([namespace, propertyNamespace, ...oldKey] as unknown as TQueryKey);
    const queryFn = ({ pageParam }: { pageParam?: number }) => property.queryFn(clientGetter(), pageParam || 1).then(mapResponse(property.toastError || false));
    const getNextPageParam = (data: PageResponse<DataType>) => data.page === data.totalPages ? null : data.page + 1;

    let initialData: InfiniteData<PageResponse<DataType>, number> | undefined;

    if (property.initialData) {
        initialData = {
            pages: [property.initialData],
            pageParams: [1],
        };
    }

    return {
        ...property,
        initialData,
        queryKey: newKey,
        queryFn,
        getNextPageParam,
        initialPageParam: 1,
        queryClientGetter: queryClient,
    };
}
