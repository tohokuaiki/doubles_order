import { AnimatePresence, motion } from "framer-motion";
import React, { type ReactNode, useState } from "react";

export const Nl2Br = ({ text }: { text: string }): ReactNode => {
    return <>{text.split('\n').map((line, index) => (
        <React.Fragment key={index}>
            {line}
            <br />
        </React.Fragment>
    ))}</>;
}

export const MoreList = <
    T extends Record<string, unknown>,
    K extends keyof T = 'name'
>(props: T[],
    options: {
        keyName?: K;
        maxsize?: number;
        moreText?: string;
    }): ReactNode => {

    const {
        maxsize = 3,
        moreText = "...more",
        keyName = 'name'
    } = options;

    const [expand, setExpand] = useState<boolean>(false);

    return props.map((prop, i) => (
        i < maxsize || expand ? <li key={i}><>{prop[keyName]}</>
            {i + 1 === maxsize && props.length !== maxsize && !expand ? <span className="more-text" onClick={() => setExpand(true)}>{moreText}</span> : ""}
        </li> : ""
    ));
}

export const AnimationDiv = ({ visible, duration = 0.5, children, onComplete }: {
    visible: boolean;
    duration?: number;
    children?: ReactNode;
    onComplete?: () => void;
}): ReactNode => {
    return <AnimatePresence initial={false}>
        {visible && (
            <motion.div
                key="step"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration }}
                onAnimationComplete={() => onComplete && onComplete()}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
}

export const Accordion = ({ title, children, className }: { title: ReactNode, children: ReactNode, className?: string }) => {

    const [open, setOpen] = useState(false);

    return (
        <div className={className}>
            <div
                onClick={() => setOpen(!open)}
                className="title"
            >
                {title}
                <span>{open ? "▲" : "▼"}</span>
            </div>

            <AnimationDiv visible={open}>{children}</AnimationDiv>
        </div>
    );
};

interface WrapAuthorOptions {
    text: string;
    authorNames?: string[];
    className?: string;
}

/**
 * テキスト内の指定著者名を <span> でラップ
 */
export const WrapAuthors = ({
    text,
    authorNames = ["保田隆明", "Takaaki Hoda"],
    className = "author-hoda",
}: WrapAuthorOptions): ReactNode => {
    // 正規表現で分割
    const parts = text.split(new RegExp(`(${authorNames.join("|")})`));

    return (
        <>
            {parts.map((part, index) =>
                authorNames.includes(part) ? (
                    <span key={index} className={className}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};
