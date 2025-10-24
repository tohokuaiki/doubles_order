import { type ReactElement, type ReactNode, useContext } from "react";
import BaseLoading from "./BaseLoading";
import { FakeLoadingContext } from "../Context/FakeLoadingContext";

export default function FakeLoading({ children }: {
    children?: ReactNode;
}): ReactElement {

    const { loading } = useContext(FakeLoadingContext)

    return <BaseLoading active={loading} fadeSpeed={1000}>{children}</BaseLoading>
}