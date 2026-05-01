import clsx from 'clsx';
import clsMain from './Main.module.scss';
import cls from './Uploader.module.scss';
import { MdOutlineImage } from 'react-icons/md';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VscClose } from 'react-icons/vsc';
import Spinner from '../components/Spinner';
import { API } from '../services/api';
import { randomString } from '../utils/string';
import { storeGet, storeSet } from '../lib/store';
import { fetch } from '@tauri-apps/plugin-http';
import { UserType } from '../types/user';

export default function UploaderScreen() {
    const [file, setFile] = useState<null | File>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [fileBuffer, setFileBuffer] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(false);
    const [editCaption, setEditCaption] = useState(false);
    const [caption, setCaption] = useState("");

    const handleCancel = () => {
        setFile(null);
        setFileBuffer(null);
        setEditCaption(false);
        setCaption("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    const handleUploadImage = useCallback(async () => {
        if (!fileBuffer) return;
        setLoading(true);

        const user = await storeGet<UserType>('user');
        let token = await storeGet<string>('token');
        let refreshTokenStr = await storeGet<string>('refreshToken');

        if (!user || !token || !refreshTokenStr) {
            setError("Error getting user info");
            setLoading(false);
            return;
        }

        const userId = user.localId;
        const imageName = randomString(20) + ".webp";

        try {
            let newToken;
            try {
                newToken = await API.refreshToken(refreshTokenStr);
                if (!newToken) throw new Error("null response");
            } catch (e: any) {
                setError(`[1] refresh token failed: ${e?.error?.message ?? e?.message ?? JSON.stringify(e)}`);
                setLoading(false);
                return;
            }

            token = newToken.id_token;
            refreshTokenStr = newToken.refresh_token;
            await storeSet('token', token);
            await storeSet('refreshToken', refreshTokenStr);

            const initResp = await fetch(
                `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}?uploadType=resumable&name=users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json; charset=UTF-8",
                        Accept: "application/json",
                        "X-Goog-Upload-Protocol": "resumable",
                        "X-Goog-Upload-Content-Length": fileBuffer.size.toString(),
                        "X-Firebase-Storage-Version": "ios/10.28.1",
                        "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                        "X-Goog-Upload-Content-Type": "image/webp",
                        "X-Goog-Upload-Command": "start",
                        "X-Firebase-Gmpid": "1:641029076083:ios:cc8eb46290d69b234fa609",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        name: `users/${userId}/moments/thumbnails/${imageName}`,
                        contentType: "image/webp",
                        bucket: "",
                        metadata: { creator: userId, visibility: "private" }
                    })
                }
            );

            if (!initResp.ok) {
                const body = await initResp.text().catch(() => "");
                setError(`[2] init upload failed ${initResp.status}: ${body.slice(0, 120)}`);
                setLoading(false);
                return;
            }

            const uploadEndpoint = initResp.headers.get("X-Goog-Upload-URL");
            if (!uploadEndpoint) {
                setError("[3] no upload URL in response headers");
                setLoading(false);
                return;
            }

            const uploadResp = await fetch(uploadEndpoint, {
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-Goog-Upload-Command": "upload, finalize",
                    "X-Goog-Upload-Offset": "0",
                    "Upload-Incomplete": "?0",
                    "Upload-Draft-Interop-Version": "3",
                    "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                },
                method: "PUT",
                body: fileBuffer
            });

            if (!uploadResp.ok) {
                const body = await uploadResp.text().catch(() => "");
                setError(`[4] PUT upload failed ${uploadResp.status}: ${body.slice(0, 120)}`);
                setLoading(false);
                return;
            }

            const endUrl = `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userId}%2Fmoments%2Fthumbnails%2F${imageName}`;
            const getUrlResp = await fetch(endUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json; charset=UTF-8",
                    Accept: "application/json",
                    "User-Agent": "com.locket.Locket/1.43.1 iPhone/18.1 hw/iPhone15_3 (GTMSUF/1)",
                }
            });

            if (!getUrlResp.ok) {
                const body = await getUrlResp.text().catch(() => "");
                setError(`[5] get URL failed ${getUrlResp.status}: ${body.slice(0, 120)}`);
                setLoading(false);
                return;
            }

            const urlJson = await getUrlResp.json();
            const imgToken = urlJson.downloadTokens;
            if (!imgToken) {
                setError(`[6] no downloadTokens in response: ${JSON.stringify(urlJson).slice(0, 120)}`);
                setLoading(false);
                return;
            }

            const finalImageUrl = endUrl + "?alt=media&token=" + imgToken;
            try {
                const createPost = await API.createPost(finalImageUrl, caption, token);
                if (!createPost) throw new Error("null response");
            } catch (e: any) {
                setError(`[7] post failed: ${e?.error?.message ?? e?.message ?? JSON.stringify(e)}`);
                setLoading(false);
                return;
            }

            setError("Done!");
            setLoading(false);
            handleCancel();
        } catch (e: any) {
            setError(`[0] ${e?.message ?? JSON.stringify(e)}`);
            setLoading(false);
        }
    }, [caption, fileBuffer]);

    const previewUrl = useMemo(() => {
        if (fileBuffer) {
            return URL.createObjectURL(fileBuffer);
        }
        return "";
    }, [fileBuffer]);

    useEffect(() => {
        if (!file) return;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => img.src = reader.result as string;
        reader.readAsDataURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 1020;
            const size = Math.min(img.width, img.height, maxSize);
            const scale = size / Math.min(img.width, img.height);

            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Error converting image to WebP [CANVAS_NULLED]');
                setLoading(false);
                handleCancel();
                return;
            }

            const offsetX = (size - img.width * scale) / 2;
            const offsetY = (size - img.height * scale) / 2;

            ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        setFileBuffer(blob);
                    } else {
                        setError('Error converting image to WebP');
                        handleCancel();
                    }
                    setLoading(false);
                },
                'image/webp',
                0.9
            );
        };
    }, [file]);

    return (
        <>
            <div className={clsx(clsMain.MainScreen, cls.Uploader)}>
                <div className={clsx("Error", !!error && "showErr")}>
                    <span>{error}</span>
                    <div className={"Close"} onClick={() => setError("")}>
                        <VscClose />
                    </div>
                </div>
                <div className={clsMain.Moment}>
                    <div className={clsMain.LsMoment}>
                        <div className={clsMain.Main}>
                            <div className={clsMain.Image} style={{ "--moment-img": `url(${previewUrl})` } as React.CSSProperties}>
                                <input
                                    ref={inputRef}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            if (e.target.files[0].size > 4 * 1024 * 1024) {
                                                setError("Image size exceeded limit");
                                                handleCancel();
                                                return;
                                            }
                                            if (e.target.files[0].type !== "image/jpeg" && e.target.files[0].type !== "image/png") {
                                                setError("Unsupported file");
                                                handleCancel();
                                                return;
                                            }
                                            setLoading(true);
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    className={cls.UploadInput} type="file" accept=".jpeg,.jpg,.png" />
                                {previewUrl.length > 0 ? <div
                                    onClick={() => !loading && setEditCaption(true)}
                                    className={clsMain.Caption}>
                                    {editCaption ? <input
                                        onBlur={() => {
                                            setEditCaption(false);
                                        }}
                                        className={cls.editCaption}
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                    /> : caption.length > 0 ? caption : "click to add caption"}
                                </div> : <div className={cls.UploaderOverlay}>
                                    <div className={cls.Icon}>
                                        <MdOutlineImage />
                                    </div>
                                    <h2>drag and drop or click to choose image</h2>
                                    <p>supports jpeg/png below 4MB</p>
                                </div>}
                            </div>
                            <div className={clsMain.UserInfo}>
                                <button disabled={loading || !file} onClick={() => handleUploadImage()} className={clsx("btn", "btn-soft", cls.UploadBtn)}>
                                    {loading ? <Spinner /> : "upload"}
                                </button>
                                <button disabled={loading || !file} className={cls.CloseBtn} onClick={handleCancel}>
                                    <VscClose />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
