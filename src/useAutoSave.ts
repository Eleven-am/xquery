import {UseAutoSaveActionOptions} from "./types";
import {QueryKey} from "@tanstack/query-core";
import {useAction} from "./useAction";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from 'react';
import {useTimer} from "./useTimer";
import {usePrevious} from "./usePrevious";

function deepCompare (firstObject: any, secondObject: any): boolean {
    if (firstObject === secondObject) {
        return true;
    }

    if (firstObject instanceof Date && secondObject instanceof Date) {
        return firstObject.getTime() === secondObject.getTime();
    }

    if (Array.isArray(firstObject) && Array.isArray(secondObject)) {
        if (firstObject.length !== secondObject.length) {
            return false;
        }

        return firstObject.every((item, index) => deepCompare(item, secondObject[index]));
    }

    if (firstObject && secondObject && typeof firstObject === 'object' && typeof secondObject === 'object') {
        if (firstObject.constructor !== secondObject.constructor) {
            return false;
        }
        const properties = Object.keys(firstObject);

        if (properties.length !== Object.keys(secondObject).length) {
            return false;
        }

        return properties.every((prop) => deepCompare(firstObject[prop], secondObject[prop]));
    }


    return false;
}

export function useAutoSaveAction<TData, TError, TQueryKey extends QueryKey> (
    { delay, options }: UseAutoSaveActionOptions<TData, TError, TQueryKey>,
) {
    const { start, stop } = useTimer();
    const { mutate, data: mutateData } = useAction(options);
    const [data, setData] = useState(options.queryOptions.initialData);
    const previousInitialData = usePrevious(options.queryOptions.initialData);

    useEffect(() => {
        if (deepCompare(previousInitialData, options.queryOptions.initialData)) {
            setData(options.queryOptions.initialData);
        }
    }, [options.queryOptions.initialData, previousInitialData]);

    useEffect(() => {
        if (mutateData) {
            setData(mutateData);
        }
    }, [mutateData]);

    const mutateWithDebounce = useCallback((newState: TData | ((prev: TData) => TData)) => {
        stop();
        let newData: TData;

        setData((prevState) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            newData = typeof newState === 'function' ? newState(prevState) : newState;

            return newData;
        });

        start(() => mutate(newData), delay);
    }, [delay, mutate, start, stop]);

    return [data, mutateWithDebounce] as [TData, Dispatch<SetStateAction<TData>>];
}