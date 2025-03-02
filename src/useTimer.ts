import {useCallback, useEffect, useRef} from "react";

export function useTimer() {
    const timOut = useRef<NodeJS.Timeout>(undefined);

    const start = useCallback((callback: () => void, time: number) => {
        timOut.current = setTimeout(() => {
            callback();
        }, time);
    }, []);

    const stop = useCallback(() => {
        if (timOut.current) {
            clearTimeout(timOut.current);
        }
    }, []);

    return {
        start,
        stop,
    };
}
