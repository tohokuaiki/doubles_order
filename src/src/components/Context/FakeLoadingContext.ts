import { createContext, type Dispatch, type SetStateAction } from "react";

export type FakeLoadingContextType = {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
}

export const FakeLoadingContext = createContext<FakeLoadingContextType>({
    loading: false,
    setLoading: () => { }
})
