import cls from "./SavedSection.module.scss";
import { useMainContext } from "../MainContext";

export default function SavedMoment({ setInItem }: { setInItem: (i: number) => void }) {
    const { moments } = useMainContext();

    return (
        <div className={cls.SavedMoment}>
            {moments.map((moment, i) => (
                <div key={i}
                    className={cls.Moment}
                    onClick={() => setInItem(i)}
                    style={{ backgroundImage: `url(${moment.thumbnail_url})` }}
                ></div>
            ))}
        </div>
    )
}
