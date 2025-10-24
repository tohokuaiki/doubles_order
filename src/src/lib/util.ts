export const CONSTANT: Record<string, string> = {
    FORMAT_DATETIME: 'yyyy/MM/dd HH:mm:ss',
    FORMAT_DATE: 'yyyy/MM/dd',
    FORMAT_INPUT_DATE: "yyyy-MM-dd'T'HH:mm:ss"
}

type TruncateOptions = {
    /** 省略記号（デフォルトは '…'） */
    ellipsis?: string;
    /**
     * ellipsis を max に含めるか。
     * - true: 「結果の長さ」が max を超えない（デフォルト: false）
     * - false: 元の文字列の本文だけを max 文字にして、必要なら ellipsis を付ける
     */
    includeEllipsisInMax?: boolean;
};


const Util = {
    // 透明な1x1のPNG画像
    transparentBase64:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wIAAgkBDXz5ZQAAAABJRU5ErkJggg==",
    // Window topに
    returnTop: () => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth", }), 1);
    },

    sleep: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

    trimString: (
        input: string,
        max: number,
        options: TruncateOptions = {}
    ): string => {
        const { ellipsis = '…', includeEllipsisInMax = false } = options;

        if (max <= 0) {
            return '';
        }

        const chars = Array.from(input); // code points 単位
        if (chars.length <= max) return input;

        const ellipsisChars = Array.from(ellipsis);
        if (includeEllipsisInMax) {
            const allowed = max - ellipsisChars.length;
            if (allowed <= 0) {
                // max が ellipsis の長さ以下の場合、ellipsis を max 長さに切って返す
                return ellipsisChars.slice(0, max).join('');
            }
            return chars.slice(0, allowed).join('') + ellipsis;
        } else {
            // 本文を max 文字にしてから ellipsis を付ける（結果長は max + ellipsis.length）
            return chars.slice(0, max).join('') + ellipsis;
        }
    }

}

export default Util;
