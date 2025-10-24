import { useEffect, useState, type Dispatch, type JSX, type SetStateAction } from "react";
import type { Game, Match } from "../@types/app";


export default function MatchList({ matches, setRemoveMember }: {
    matches: Match[];
    setRemoveMember: Dispatch<SetStateAction<string[]>>;
}): JSX.Element {

    const [games, setGames] = useState<Game[]>([]);

    useEffect(() => {
        const newGames: Game[] = [];
        for (let i = 0; i < matches.length; i += 2) {
            const game: Game = matches.slice(i, i + 2);
            // もし1組だけの場合は空ペアを追加
            if (game.length === 1) {
                game.push([{ name: "", sex: "women" }, { name: "", sex: "women" }]);
            }
            newGames.push(game);
        }
        setGames(newGames);
    }, [matches]);

    const changeRemoveMember = (appendName: string, flag: boolean) => {
        setRemoveMember((prev) => {
            const members = [...prev];
            if (flag) {
                members.push(appendName);
                return members;
            } else {
                return members.filter((m) => m !== appendName);
            }
        })
    }

    return <div>{games.map((game, i) =>
        <div className="match" key={i}>
            <h4>{i + 1}コート</h4>
            <div className="row">
                {game.map((match, k) => <div className="col" key={k}>
                    <ul className="list-group">
                        {match.map((member, j) => <li
                            className={`list-group-item list-group-item-${!member.name ? "secondary" : member.sex === "men" ? "primary" : "danger"} text-center`} key={j}>
                            <label className="form-check-label">
                                {member.name ? <span><input type="checkbox" className="form-check-input"
                                    onChange={(e) => changeRemoveMember(member.name, e.target.checked)}
                                />{member.name}</span> : ""}
                            </label>
                        </li>
                        )}
                    </ul>
                </div>
                )}
            </div>
        </div>)}
    </div>
}