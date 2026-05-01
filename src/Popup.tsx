import { useEffect, useState } from "react"
import LoginScreen from "./screens/Login"
import LoadingScreen from "./screens/Loading";
import { MainContext } from "./MainContext";
import { UserType } from "./types/user";
import GlobalScreen from "./screens/Global";
import { storeGet } from "./lib/store";
import { onLogout, onNewMoment, startMomentPolling, stopMomentPolling } from "./lib/momentService";
import { SavedMomentType } from "./types/moments";

function Popup() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserType | null>(null);
    const [moments, setMoments] = useState<SavedMomentType[]>([]);

    useEffect(() => {
        const init = async () => {
            const token = await storeGet<string>('token');
            const user = await storeGet<UserType>('user');
            const saved = (await storeGet<SavedMomentType[]>('moments')) ?? [];

            if (token && user) {
                setUserData(user);
                setMoments(saved);
                setLoggedIn(true);
                startMomentPolling();
            }
            setLoading(false);
        };

        init();

        const unsubMoment = onNewMoment((m) => setMoments(m));
        const unsubLogout = onLogout(() => {
            setLoggedIn(false);
            setUserData(null);
            setMoments([]);
            stopMomentPolling();
        });

        return () => {
            unsubMoment();
            unsubLogout();
            stopMomentPolling();
        };
    }, []);

    const handleLogin = async (user: UserType) => {
        const saved = (await storeGet<SavedMomentType[]>('moments')) ?? [];
        setUserData(user);
        setMoments(saved);
        setLoggedIn(true);
        startMomentPolling();
    };

    return (
        <MainContext.Provider value={{ loggedIn, setLoggedIn, loading, setLoading, userData, setUserData, moments, setMoments, handleLogin }}>
            <div className="app-root">
                {!loggedIn && !loading && <LoginScreen />}
                {loggedIn && !loading && <GlobalScreen />}
                {loading && <LoadingScreen />}
            </div>
        </MainContext.Provider>
    )
}

export default Popup;
