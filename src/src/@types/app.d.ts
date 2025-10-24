export type Member = {
    name: string;
    rank: number;
};

export type MemberList = {
    men: Member[];
    women: Member[];
};

export type SexList = keyof MemberList;

export type EntryList = Record<SexList, string>;

export type Pairs = {
    pair: string[];
    total_rank: number;
}[];

export type Match = {
    name: string;
    sex: SexList;
}[];

export type Game = Match[];
