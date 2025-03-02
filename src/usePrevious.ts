import {useEffect, useRef} from "react";

export function usePrevious<DataType> (value: DataType): DataType {
    const ref = useRef<DataType>(value);

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
}
