import { useState, useEffect } from "react";
import LuckitLogo from "../components/Logo";
import { VERSION } from "../const";
import cls from "./About.module.scss";
import { MdOutlineNotifications, MdOutlineFileUpload, MdOutlineFileDownload, MdOutlinePhotoLibrary } from "react-icons/md";
import { TbBrandGithub } from "react-icons/tb";
import { RiPushpinLine } from "react-icons/ri";
import { fetch } from "@tauri-apps/plugin-http";

const features = [
    { icon: <MdOutlineNotifications />, label: "System notification on new moments" },
    { icon: <RiPushpinLine />, label: "Always-on-top widget, bottom-left corner" },
    { icon: <MdOutlinePhotoLibrary />, label: "Browse & save moments locally" },
    { icon: <MdOutlineFileUpload />, label: "Upload photos to Locket" },
    { icon: <MdOutlineFileDownload />, label: "Download moments to your device" },
];

function isNewer(latest: string, current: string): boolean {
    const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
    const [la, lb, lc] = parse(latest);
    const [ca, cb, cc] = parse(current);
    if (la !== ca) return la > ca;
    if (lb !== cb) return lb > cb;
    return lc > cc;
}

export default function AboutScreen() {
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetch("https://api.github.com/repos/Holozok/luckit/releases/latest", {
            method: "GET",
            headers: { Accept: "application/vnd.github+json" },
        })
            .then((r) => r.json() as Promise<{ tag_name?: string }>)
            .then((data) => {
                if (data.tag_name) setLatestVersion(data.tag_name);
            })
            .catch(() => {})
            .finally(() => setChecking(false));
    }, []);

    const hasUpdate = latestVersion !== null && isNewer(latestVersion, VERSION);

    return (
        <div className={cls.About}>
            <div className={cls.Header}>
                <div className={cls.LogoWrap}>
                    <LuckitLogo />
                </div>
                <h1>luckit</h1>
                <span className={cls.Badge}>v{VERSION} · Windows</span>
                <p className={cls.Tagline}>
                    An unofficial Locket client — desktop widget for Windows
                </p>
            </div>

            {checking ? (
                <div className={cls.UpdateStatus}>Checking for updates...</div>
            ) : hasUpdate ? (
                <a
                    className={cls.UpdateBanner}
                    href="https://github.com/Holozok/luckit/releases/latest"
                    target="_blank"
                >
                    <span className={cls.UpdateDot} />
                    <span className={cls.UpdateText}>
                        New version available: <strong>{latestVersion}</strong>
                    </span>
                    <span className={cls.UpdateLink}>Download →</span>
                </a>
            ) : latestVersion !== null ? (
                <div className={cls.UpdateStatus + " " + cls.UpToDate}>✓ Up to date</div>
            ) : null}

            <div className={cls.Features}>
                {features.map((f, i) => (
                    <div key={i} className={cls.Feature}>
                        <span className={cls.FeatureIcon}>{f.icon}</span>
                        <span>{f.label}</span>
                    </div>
                ))}
            </div>

            <div className={cls.Credits}>
                <h2>Credits</h2>
                <div className={cls.Authors}>
                    <a className={cls.Author} target="_blank" href="https://github.com/michioxd">
                        <TbBrandGithub />
                        michioxd
                        <span className={cls.AuthorRole}>original author</span>
                    </a>
                    <a className={cls.Author} target="_blank" href="https://github.com/holozok">
                        <TbBrandGithub />
                        Holozok
                        <span className={cls.AuthorRole}>Windows app</span>
                    </a>
                </div>
                <p className={cls.Sub}>
                    Released under{" "}
                    <a target="_blank" href="https://github.com/michioxd/luckit/blob/main/LICENSE">MIT License</a>
                    {" "}·{" "}
                    <a target="_blank" href="https://github.com/Holozok/luckit">Source on GitHub</a>
                </p>
            </div>

            <div className={cls.Disclaimer}>
                <h2>Disclaimer</h2>
                <p>
                    This project is not affiliated with Locket or Locket Labs, Inc. By using this software you acknowledge it is an unofficial client and accept the risk that your account may be banned. The authors are not responsible for any consequences.
                </p>
            </div>

            <div className={cls.Footer}>
                &copy; {new Date().getFullYear()} michioxd & Holozok
            </div>
        </div>
    );
}
