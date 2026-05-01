import MainScreen from "./Main";
import cls from "./Global.module.scss";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";
import { Menu, MenuButton, MenuItem, SubMenu } from "@szhsin/react-menu";
import clsx from "clsx";
import { useMainContext } from "../MainContext";
import { IoMdHeartEmpty } from "react-icons/io";
import { HiLogout, HiOutlineDownload, HiOutlineUpload } from "react-icons/hi";
import { GrAppsRounded } from "react-icons/gr";
import { AiOutlineClear } from "react-icons/ai";
import { VERSION } from "../const";
import { MdRefresh } from "react-icons/md";
import { useRef, useState } from "react";
import SavedMoment from "./SavedMoments";
import { IoChevronBack } from "react-icons/io5";
import AboutScreen from "./About";
import UploaderScreen from "./Uploader";
import { clearMoments, fetchLatestMoment, logout } from "../lib/momentService";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

const menuItemClassName = ({ hover }: { hover: boolean }) =>
    clsx(cls.MenuItem, hover && cls.hover);

const RefreshMenuItem = () => {
    const [disabledRefresh, setDisabledRefresh] = useState(false);

    return (
        <MenuItem disabled={disabledRefresh} onClick={async () => {
            if (disabledRefresh) return;
            setDisabledRefresh(true);
            try { await fetchLatestMoment(); } catch { /* empty */ }
            setTimeout(() => setDisabledRefresh(false), 5_000);
        }} className={menuItemClassName}>
            <MdRefresh />
            {disabledRefresh ? "Refreshing..." : "Refresh"}
        </MenuItem>
    )
}

export default function GlobalScreen() {
    const mainCtx = useMainContext();
    const [inItem, setInItem] = useState(0);
    const [section, setSection] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const confirmDeleteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const downloadCurrentMoment = async () => {
        const moment = mainCtx.moments[inItem];
        if (!moment) return;

        const isVideo = !!moment.video_url;
        const url = isVideo ? moment.video_url! : moment.thumbnail_url;
        const ext = isVideo ? 'mp4' : 'webp';

        try {
            const savePath = await save({
                filters: [{ name: isVideo ? 'Video (MP4)' : 'Image (WebP)', extensions: [ext] }],
                defaultPath: `moment_${Date.now()}.${ext}`,
            });
            if (!savePath) return;

            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            await writeFile(savePath, new Uint8Array(buffer));
        } catch { /* empty */ }
    };

    return (
        <div className={cls.Global} data-section={section}>
            <div onClick={() => setSection(0)} className={clsx(cls.MenuBtn, cls.BackBtn)}>
                <IoChevronBack />
            </div>
            <Menu menuClassName={cls.Menu} menuButton={<MenuButton className={clsx(cls.MenuBtn, cls.MainMenuBtn)}>
                <PiDotsThreeOutlineVerticalLight />
            </MenuButton>} transition>
                <SubMenu label={
                    <>
                        <img className={cls.Avatar} src={mainCtx?.userData?.photoUrl} alt={mainCtx?.userData?.displayName} />
                        <span className={cls.Name}>{mainCtx?.userData?.displayName ? mainCtx?.userData?.displayName : mainCtx?.userData?.email}</span>
                    </>
                } menuClassName={cls.Menu} className={cls.AccountMenu}>
                    <MenuItem onClick={async () => {
                        if (confirmDelete) {
                            await clearMoments();
                            mainCtx.setMoments([]);
                            setConfirmDelete(false);
                            clearTimeout(confirmDeleteTimeout.current!);
                            return;
                        }

                        setConfirmDelete(true);
                        confirmDeleteTimeout.current = setTimeout(() => {
                            setConfirmDelete(false);
                        }, 5_000);
                    }} className={menuItemClassName}>
                        <AiOutlineClear />
                        {confirmDelete ? "Click again to confirm" : "Clear gallery"}
                    </MenuItem>
                    <MenuItem onClick={async () => {
                        await logout();
                        mainCtx.setLoggedIn(false);
                    }} className={menuItemClassName}>
                        <HiLogout />
                        Log out
                    </MenuItem>
                </SubMenu>
                <MenuItem onClick={() => setSection(2)} className={menuItemClassName}>
                    <IoMdHeartEmpty />
                    About luckit v{VERSION}
                </MenuItem>
                <RefreshMenuItem />
                <MenuItem onClick={() => setSection(1)} className={menuItemClassName}>
                    <GrAppsRounded />
                    Gallery
                </MenuItem>
                <MenuItem onClick={() => setSection(3)} className={menuItemClassName}>
                    <HiOutlineUpload />
                    Upload moment
                </MenuItem>
                <MenuItem onClick={downloadCurrentMoment} className={menuItemClassName}>
                    <HiOutlineDownload />
                    Download this moment
                </MenuItem>
            </Menu>
            <div className={cls.Section} data-section="0">
                <MainScreen
                    inItem={inItem}
                    setInItem={setInItem}
                />
            </div>
            <div className={cls.Section} data-section="1">
                <SavedMoment setInItem={(i: number) => {
                    setInItem(i);
                    setSection(0);
                }} />
            </div>
            <div className={cls.Section} data-section="2">
                <AboutScreen />
            </div>
            <div className={cls.Section} data-section="3">
                <UploaderScreen />
            </div>
        </div>
    )
}
