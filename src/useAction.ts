import {
    DefinedInitialDataOptions,
    UndefinedInitialDataOptions,
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";
import {QueryKey} from "@tanstack/query-core";
import {BaseActionOptions, DefinedActionResult, UndefinedActionResult} from "./types";

export function useAction<TData, MData, TError, TVariables, TQueryKey extends QueryKey> (
    options: BaseActionOptions<TData, TVariables, DefinedInitialDataOptions<TData, TError, TData, TQueryKey>, TError, MData>,
): DefinedActionResult<TData, MData, TVariables, TError>;

export function useAction<TData, MData, TError, TVariables, TQueryKey extends QueryKey> (
    options: BaseActionOptions<TData, TVariables, UndefinedInitialDataOptions<TData, TError, TData, TQueryKey>, TError, MData>,
): UndefinedActionResult<TData, MData, TVariables, TError>;

export function useAction<TData, MData, TVariables> (
    { queryOptions, mutateOptions, queryClientGetter }: BaseActionOptions<TData, TVariables, any, MData>,
): any {
    const queryResult = useQuery(queryOptions, queryClientGetter());
    const mutate = useMutation(mutateOptions, queryClientGetter());

    return {
        ...mutate,
        ...queryResult,
    };
}
