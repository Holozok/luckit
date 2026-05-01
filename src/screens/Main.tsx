import cls from "./Main.module.scss"
import { useEffect, useRef, useState } from "react";
import { SavedMomentType } from "../types/moments";
import { timeSinceOf } from "../utils/string";
import { MdOutlineImageNotSupported } from "react-icons/md";
import { BsFillPlayFill, BsPauseFill } from "react-icons/bs";
import { MdVideocam } from "react-icons/md";
import clsx from "clsx";
import { IoMdArrowRoundUp } from "react-icons/io";
import { useMainContext } from "../MainContext";

function TimeCount({ date }: { date: number }) {
    const [time, setTime] = useState(timeSinceOf(date));

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(timeSinceOf(date));
        }, 1000);
        return () => clearInterval(interval);
    }, [date]);

    return <span className={cls.Time}>{time}</span>;
}

function VideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [paused, setPaused] = useState(false);

    const toggle = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPaused(false); }
        else { v.pause(); setPaused(true); }
    };

    return (
        <div className={cls.VideoWrap} onClick={toggle}>
            <video
                ref={videoRef}
                className={cls.Video}
                src={src}
                autoPlay
                loop
                muted
                playsInline
            />
            <div className={clsx(cls.PlayOverlay, paused && cls.visible)}>
                {paused ? <BsFillPlayFill /> : <BsPauseFill />}
            </div>
        </div>
    );
}

function MomentItem({ moment }: { moment: SavedMomentType }) {
    return (
        <div className={cls.Main}>
            <div
                className={cls.Image}
                style={{ "--moment-img": `url(${moment.thumbnail_url})` } as React.CSSProperties}
            >
                {moment.video_url && <VideoPlayer src={moment.video_url} />}
                {moment.video_url && (
                    <div className={cls.VideoBadge}>
                        <MdVideocam /> video
                    </div>
                )}
                {moment.caption?.length > 0 && (
                    <div className={cls.Caption}>{moment.caption}</div>
                )}
            </div>
            <div className={cls.UserInfo}>
                {moment.user.avatar && (
                    <img className={cls.Avatar} alt="" src={moment.user.avatar} />
                )}
                <span className={cls.Name}>{moment.user.username}</span>
                <TimeCount date={moment.seconds || 0} />
            </div>
        </div>
    );
}

export default function MainScreen({
    inItem,
    setInItem,
}: {
    inItem: number;
    setInItem: React.Dispatch<React.SetStateAction<number>>;
}) {
    const { moments } = useMainContext();
    const [showNewItemBtn, setShowNewItemBtn] = useState(false);
    const prevLengthRef = useRef(moments.length);

    useEffect(() => {
        if (moments.length > prevLengthRef.current) {
            setInItem(p => {
                if (p > 0) { setShowNewItemBtn(true); return p + 1; }
                return 0;
            });
        }
        prevLengthRef.current = moments.length;
    }, [moments.length, setInItem]);

    const handleChangeTile = (add: boolean) => {
        setInItem(p => {
            if (add) return p + 1 >= moments.length ? moments.length - 1 : p + 1;
            return p - 1 <= 0 ? 0 : p - 1;
        });
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown")
                handleChangeTile(e.key === "ArrowDown");
        };
        const onWheel = (e: WheelEvent) => handleChangeTile(e.deltaY > 0);

        window.addEventListener("keydown", onKey);
        window.addEventListener("wheel", onWheel);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("wheel", onWheel);
        };
    }, [moments.length]);

    return (
        <div className={cls.MainScreen}>
            <div className={cls.Moment}>
                {moments.length < 1 ? (
                    <div className={cls.NoMoment}>
                        <div className={cls.NoImage}>
                            <MdOutlineImageNotSupported />
                        </div>
                        <h2>no moment to show right now...</h2>
                        <p>wait a bit for us to hear your friend</p>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => { setInItem(0); setShowNewItemBtn(false); }}
                            className={clsx("btn", cls.NewBtn, showNewItemBtn && cls.ShowBtn)}
                        >
                            new moment <span><IoMdArrowRoundUp /></span>
                        </button>
                        <div
                            className={cls.LsMoment}
                            style={{ transform: `translateY(-${inItem * (100 / moments.length)}%)` }}
                        >
                            {moments.map((moment, index) => (
                                <MomentItem key={index} moment={moment} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
