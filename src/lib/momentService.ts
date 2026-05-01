import { md5 } from 'js-md5';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { API } from '../services/api';
import { SavedMomentType } from '../types/moments';
import { UserType } from '../types/user';
import { storeDeleteMultiple, storeGet, storeSet } from './store';

type MomentCallback = (moments: SavedMomentType[]) => void;
type LogoutCallback = () => void;

let momentCallbacks: MomentCallback[] = [];
let logoutCallbacks: LogoutCallback[] = [];
let loopTimer: ReturnType<typeof setTimeout> | null = null;

export function onNewMoment(cb: MomentCallback): () => void {
    momentCallbacks.push(cb);
    return () => {
        momentCallbacks = momentCallbacks.filter(c => c !== cb);
    };
}

export function onLogout(cb: LogoutCallback): () => void {
    logoutCallbacks.push(cb);
    return () => {
        logoutCallbacks = logoutCallbacks.filter(c => c !== cb);
    };
}

async function notifyMomentCallbacks(): Promise<void> {
    const moments = (await storeGet<SavedMomentType[]>('moments')) ?? [];
    momentCallbacks.forEach(cb => cb(moments));
}

async function pushSystemNotification(moment: SavedMomentType): Promise<void> {
    try {
        let granted = await isPermissionGranted();
        if (!granted) {
            const permission = await requestPermission();
            granted = permission === 'granted';
        }
        if (!granted) return;

        const hasVideo = !!moment.video_url;
        const title = moment.user.username;
        const body = moment.caption?.trim()
            ? moment.caption
            : hasVideo ? 'Sent a new video moment' : 'Sent a new moment';

        sendNotification({ title, body });
    } catch {
        // silently ignore notification errors
    }
}

async function refreshToken(rT: string): Promise<{ token: string; refreshToken: string } | null> {
    try {
        const newToken = await API.refreshToken(rT);
        if (!newToken.access_token) {
            await storeDeleteMultiple(['token', 'refreshToken', 'user']);
            logoutCallbacks.forEach(cb => cb());
            return null;
        }
        await storeSet('token', newToken.access_token);
        await storeSet('refreshToken', newToken.refresh_token);
        return { token: newToken.access_token, refreshToken: newToken.refresh_token };
    } catch {
        return null;
    }
}

export async function fetchLatestMoment(): Promise<void> {
    let token = await storeGet<string>('token');
    let rToken = await storeGet<string>('refreshToken');

    if (!token || !rToken) return;

    let isOkay = false;

    try {
        const accInfo = await API.getAccountInfo(token);
        await storeSet('user', accInfo.users[0] as UserType);
        isOkay = true;
    } catch {
        const refreshed = await refreshToken(rToken);
        if (refreshed) {
            token = refreshed.token;
            rToken = refreshed.refreshToken;
            isOkay = true;
        }
    }

    if (!isOkay) return;

    try {
        const moment = await API.fetchLatestMoment(token);
        if (!moment?.data?.[0]) return;

        const lastMD5 = (await storeGet<string>('lastMD5')) ?? '';
        const currentMD5 = md5(JSON.stringify(moment.data[0]));
        const thisMoment = moment.data[0];

        if (lastMD5 === currentMD5) return;

        const moments = (await storeGet<SavedMomentType[]>('moments')) ?? [];
        if (moments.some(m => (m.md5 ?? md5(JSON.stringify(m))) === currentMD5)) return;

        const thisUser = await API.fetchUser(thisMoment.user, token);
        if (!thisUser?.data?.uid) return;

        const newMoment: SavedMomentType = {
            user: {
                username: thisUser.data.first_name + ' ' + thisUser.data.last_name,
                avatar: thisUser.data.profile_picture_url,
                uid: thisUser.data.uid,
            },
            md5: currentMD5,
            thumbnail_url: thisMoment.thumbnail_url,
            ...(thisMoment.video_url ? { video_url: thisMoment.video_url } : {}),
            seconds: thisMoment.date._seconds * 1000,
            caption: thisMoment.caption,
        };

        await storeSet('lastMD5', currentMD5);
        await storeSet('moments', [newMoment, ...moments]);
        await pushSystemNotification(newMoment);
        await notifyMomentCallbacks();
    } catch {
        // silently ignore polling errors
    }
}

export async function clearMoments(): Promise<void> {
    await storeDeleteMultiple(['moments', 'lastMD5']);
    await notifyMomentCallbacks();
}

export async function logout(): Promise<void> {
    await storeDeleteMultiple(['token', 'refreshToken', 'user', 'lastMD5']);
    logoutCallbacks.forEach(cb => cb());
}

export function startMomentPolling(): void {
    if (loopTimer !== null) return;
    const loop = async () => {
        try { await fetchLatestMoment(); } catch { /* empty */ }
        loopTimer = setTimeout(loop, 25_000);
    };
    loop();
}

export function stopMomentPolling(): void {
    if (loopTimer !== null) {
        clearTimeout(loopTimer);
        loopTimer = null;
    }
}
