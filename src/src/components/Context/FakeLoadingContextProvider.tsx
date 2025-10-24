import { type ReactNode, useState } from "react"
import { type FakeLoadingContextType, FakeLoadingContext } from "./FakeLoadingContext"

export default function FakeLoadingProvider({ children }:
    { children: ReactNode }
) {

    const [loading, setLoading] = useState<boolean>(false)

    const value: FakeLoadingContextType = {
        loading, setLoading
    }
    return <FakeLoadingContext.Provider value={value}>{children}</FakeLoadingContext.Provider>
}