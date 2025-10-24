import { type ReactNode } from 'react';
import ClipLoader from "react-spinners/ClipLoader";

export default function BaseLoading({ active, children }: {
    active: boolean;
    children?: ReactNode;
    fadeSpeed?: number;
    overlay?: () => void;
    spinner?: () => void;
    wrapper?: { [key: string]: string };
}) {

    if (!active) return children;

    return <div style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
    }}><ClipLoader
            color="#4f4f4f"
            size={50}
            cssOverride={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999
            }}
        />{children}</div>
}
