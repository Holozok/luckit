import { createContext, useContext } from "react";
import { SavedMomentType } from "./types/moments";
import { UserType } from "./types/user";

export const MainContext = createContext<{
    loggedIn: boolean;
    setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    userData: UserType | null;
    setUserData: React.Dispatch<React.SetStateAction<UserType | null>>;
    moments: SavedMomentType[];
    setMoments: React.Dispatch<React.SetStateAction<SavedMomentType[]>>;
    handleLogin: (user: UserType) => Promise<void>;
}>({
    loggedIn: false,
    setLoggedIn: () => { },
    loading: true,
    setLoading: () => { },
    userData: null,
    setUserData: () => { },
    moments: [],
    setMoments: () => { },
    handleLogin: async () => { },
});

export const useMainContext = () => {
    return useContext(MainContext);
}
