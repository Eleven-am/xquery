import {UseInfiniteScrollOptions, UseInfiniteScrollReturn} from "./types";
import {QueryKey} from "@tanstack/query-core";
import {useInfiniteQuery} from "@tanstack/react-query";
import {useCallback, useMemo} from "react";
import {useIsVisible} from "./useIsVisible";

export function useInfiniteScroll <
    DataType,
    TQueryKey extends QueryKey = QueryKey,
> (
    { options, queryClientGetter, ...rest }: UseInfiniteScrollOptions<DataType, TQueryKey>,
): UseInfiniteScrollReturn<DataType> {
    const { initialData } = rest;
    const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery(rest, queryClientGetter());

    const performFetch = useCallback(
        () => !isFetchingNextPage && hasNextPage && fetchNextPage(),
        [fetchNextPage, hasNextPage, isFetchingNextPage],
    );

    const [ref] = useIsVisible({
        action: performFetch,
        options,
    });

    const items = useMemo(() => {
        if (!data) {
            return initialData?.pages[0]?.results ?? [];
        }

        return data.pages.flatMap((page) => page.results);
    }, [data, initialData?.pages]);

    return [items, ref];
}