import { useCallback, useContext, useEffect, useState } from 'react'
import './App.scss'
import { type FakeLoadingContextType, FakeLoadingContext } from './components/Context/FakeLoadingContext';
import type { EntryList, Match, Member, MemberList, Pairs, SexList } from './@types/app';
import { AnimationDiv } from './lib/JsxUtil';
import MatchList from './components/MatchList';
import Cookies from 'js-cookie';
import Util from './lib/util';

function App() {

    const MEMBER_COOKIE_NAME = 'ochi2-member-list2';

    const { setLoading } = useContext<FakeLoadingContextType>(FakeLoadingContext);
    const defaultMemberList: MemberList = { men: [], women: [] };
    const [memberList, setMemberList] = useState<MemberList>(defaultMemberList);
    const defaultEntryList: EntryList = { men: "", women: "" };
    const [entryList, setEntryList] = useState<EntryList>(defaultEntryList);
    const [appendList, setAppendList] = useState<EntryList>(defaultEntryList);
    const [jumble, setJumble] = useState<boolean>(false);
    const [matches, setMaches] = useState<Match[]>([]);
    const [step, setStep] = useState<"step1" | "step2">("step1");
    const [history, setHistory] = useState<Pairs[]>([]);
    const [showMembers, setShowMembers] = useState<boolean>(true);
    const [removeMember, setRemoveMember] = useState<string[]>([]);

    const initMemberList = useCallback(() => {
        let setok = false;
        const cookieData = Cookies.get(MEMBER_COOKIE_NAME);
        if (cookieData) {
            try {
                setMemberList(JSON.parse(cookieData));
                setok = true;
            } catch {
                Cookies.remove(MEMBER_COOKIE_NAME);
            }
        }
        if (!setok) {
            (async () => {
                setLoading(true);
                const resp = await fetch(import.meta.env.VITE_DOUBLES_ORDER_MEMBER);
                const res = await resp.json() as Record<SexList, Record<string, number>>;
                setMemberList(() => {
                    const list = {
                        men: Object.entries(res.men).map(([k, v]) => ({ name: k, rank: v })),
                        women: Object.entries(res.women).map(([k, v]) => ({ name: k, rank: v })),
                    };
                    saveMemberList(list);
                    return list;
                });
                setLoading(false);
            })()
        }
    }, []);

    useEffect(() => {
        initMemberList();
    }, [initMemberList]);

    const saveMemberList = (list: MemberList) => {
        Cookies.set(MEMBER_COOKIE_NAME, JSON.stringify(list), { expires: 365 });
    };

    const appendMember = (member: Member, sex: SexList) => {
        setEntryList(prev => {
            const members = prev[sex].split("\n").map(m => m.trim());
            const index = members.findIndex(m => m === member.name);
            const newMembers = [...members];
            if (index >= 0) {
                newMembers.splice(index, 1);
            } else {
                newMembers.push(member.name);
            }
            return { ...prev, [sex]: newMembers.join("\n").trim() };
        });
    };

    const createMatch = async () => {
        // 名前のリストを作成
        const entries: Record<SexList, string[]> = { men: [], women: [] };
        (Object.entries({ ...entryList }) as [SexList, string][])
            .map(([sex, entry]) => {
                const queue = entry.split("\n").filter(f => f.trim().length > 0 && !removeMember.includes(f));
                queue.push(...appendList[sex].trim().split("\n").filter((m) => m.trim().length > 0));
                entries[sex].push(...queue);
            });
        const { men, women } = entries;

        // 入力内容のチェック
        const _all = [...men, ...women];
        if (_all.length !== (new Set(_all).size)) {
            alert("名前に重複があります。男女全ての名前を違うものにしてください。");
            return;
        }
        if (_all.length < 5) {
            alert('選手は5名以上入力してください。');
            return;
        }

        // AIに投げる
        setLoading(true);
        const setMemberData = (sex: SexList, members: string[]): Member[] =>
            members.map((name) => memberList[sex].find(_m => _m.name === name) || { name, rank: 5 })
        const data: {
            entries: MemberList; jumble: boolean; history: Pairs[];
        } = {
            entries: {
                men: setMemberData("men", men),
                women: setMemberData("women", women)
            },
            history,
            jumble,
        };
        const resp = await fetch(import.meta.env.VITE_DOUBLES_ORDER_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        try {
            const res = await resp.json() as Pairs;
            setHistory(prev => [...prev, res]);
            const pairs = [...res];
            // 不参加の人も詰める
            const not_entries =
                [...men, ...women].filter(name => !pairs.find(p => p.pair.includes(name)));
            for (let i = 0; i < not_entries.length; i += 2) {
                const pair = not_entries.slice(i, i + 2);
                if (pair.length === 1) pair.push("");
                pairs.push({ pair, total_rank: 0 });
            }
            // 表示用に整形
            const matches: Match[] = pairs
                .sort((p1, p2) =>
                    p1.total_rank === p2.total_rank ? 0 : p1.total_rank > p2.total_rank ? -1 : 1
                ).map(p => p.pair.map(name => ({
                    name, sex: men.includes(name) ? "men" : "women"
                })));
            setLoading(false);
            setStep('step2')
            setMaches(matches);
            // 後始末
            resetValues();
            setEntryList({ men: men.join("\n"), women: women.join("\n") });
            Util.returnTop();
        } catch (e) {
            console.log(e);
            alert("失敗しました");
            setLoading(false);
        }
    }

    const resetValues = () => {
        setRemoveMember([]);
        setAppendList(defaultEntryList);
    }

    return (
        <>
            <p className='text-center'>AIを利用したバージョンです。不具合が出る場合は<a href="/doubles-order/">以前のもの</a>を使ってください。</p>
            <h1 className="post-title">ミックスダブルス組み合わせ作成
                <button type="button" className="btn btn-info btn-sm remove-member-btns-plus"
                    onClick={() => {
                        if (confirm('最初からやり直しになりますが良いですか？')) {
                            Cookies.remove(MEMBER_COOKIE_NAME);
                            setEntryList(defaultEntryList);
                            setStep('step1')
                            initMemberList();
                            resetValues();
                        }
                    }
                    }>部員一覧を初期状態に戻す</button>
            </h1>
            <div className="dm-make container-fluid">
                <AnimationDiv visible={step === "step1"}>
                    <div>
                        <h3>参加者の記入
                            <button type="button" className="btn btn-light btn-sm border ml-2 mb-1"
                                onClick={() => {
                                    setShowMembers((prev) => !prev);
                                }}>
                                履歴ボタンを{showMembers ? "非表示" : "表示"}
                            </button>
                        </h3>
                        {showMembers ? <div className="row">
                            <div className="col">
                                <p className="member-buttons women">
                                    {memberList.women.map((m, i) =>
                                        <button key={i}
                                            className={`btn btn-sm btn-member-women ${entryList.women.split("\n").includes(m.name) ? "active" : ""}`}
                                            onClick={() => appendMember(m, "women")}>
                                            {m.name}
                                        </button>)}</p>
                                <p className="member-buttons men">
                                    {memberList.men.map((m, i) =>
                                        <button key={i}
                                            className={`btn btn-sm btn-member-men ${entryList.men.split("\n").includes(m.name) ? "active" : ""}`}
                                            onClick={() => appendMember(m, "men")}>
                                            {m.name}
                                        </button>)}</p>
                                <p className="text-center mt-1">
                                    <button type="button" className="btn btn-secondary btn-sm remove-member-btns"
                                        onClick={() => {
                                            if (confirm('ボタンを全部消してよろしいですか？')) {
                                                setMemberList(defaultMemberList);
                                                saveMemberList(defaultMemberList);
                                            }
                                        }}>参加者ボタンを全部消去</button>
                                </p>
                            </div>
                        </div> : ""}
                        <div className="row dm-inputarea">
                            <div className="col">
                                <ul className="list-group">
                                    <li className="list-group-item list-group-item-danger text-center">女性</li>
                                    <li className="list-group-item">
                                        <textarea
                                            onChange={(e) => {
                                                setEntryList(prev => {
                                                    const f = { ...prev };
                                                    f.women = e.target.value;
                                                    return f;
                                                });
                                            }}
                                            value={entryList.women}
                                        />
                                    </li>
                                </ul>
                            </div>
                            <div className="col list-group">
                                <ul className="list-group">
                                    <li className="list-group-item list-group-item-primary text-center">男性</li>
                                    <li className="list-group-item">
                                        <textarea
                                            onChange={(e) => {
                                                setEntryList(prev => {
                                                    const f = { ...prev };
                                                    f.men = e.target.value;
                                                    return f;
                                                });
                                            }}
                                            value={entryList.men}
                                        /></li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col text-center mt-2">
                                <label><input type="checkbox" rel="jumble" checked={jumble} onChange={(e) => setJumble(e.target.checked)} />男女をごちゃ混ぜにする</label><br />
                                <button type="button" className="btn btn-primary" onClick={() => createMatch()}>対戦表を作成する</button>
                            </div>
                        </div>
                    </div>
                </AnimationDiv>
                <AnimationDiv visible={step === "step2"}>
                    <div key={history.length}>
                        <h3>対戦表</h3>
                        <MatchList matches={matches} setRemoveMember={setRemoveMember} />
                        <h3>次の対戦</h3>
                        <div className="alert alert-warning" role="alert">この試合で抜ける人は対戦表の<input type="checkbox" readOnly />にチェックを入れてください。</div>
                        <h4>選手の追加</h4>
                        <div className="row dm-inputarea">
                            <div className="col">
                                <ul className="list-group">
                                    <li className="list-group-item list-group-item-danger text-center">女性</li>
                                    <li className="list-group-item">
                                        <textarea
                                            onChange={(e) => {
                                                setAppendList(prev => {
                                                    const f = { ...prev };
                                                    f.women = e.target.value;
                                                    return f;
                                                });
                                            }}
                                            value={appendList.women}
                                        />
                                    </li>
                                </ul>
                            </div>
                            <div className="col">
                                <ul className="list-group">
                                    <li className="list-group-item list-group-item-primary text-center">男性</li>
                                    <li className="list-group-item">
                                        <textarea
                                            onChange={(e) => {
                                                setAppendList(prev => {
                                                    const f = { ...prev };
                                                    f.men = e.target.value;
                                                    return f;
                                                });
                                            }}
                                            value={appendList.men}
                                        />
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col text-center">
                                <p className="mt-2">
                                    <label><input type="checkbox" rel="jumble" checked={jumble} onChange={(e) => setJumble(e.target.checked)} />男女をごちゃ混ぜにする</label><br />
                                    <button type="button" className="btn btn-primary" onClick={() => createMatch()}>次の対戦表を作成する</button>
                                </p>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col text-center">
                                <p className="mt-2"><button type="button" className="btn btn-primary"
                                    onClick={() => {
                                        setEntryList(defaultEntryList);
                                        setStep('step1');
                                        resetValues();
                                        setHistory([]);
                                        Util.returnTop();
                                    }}>最初からやり直す</button></p>
                            </div>
                        </div>
                    </div>
                </AnimationDiv>
            </div >
        </>
    )
}

export default App
