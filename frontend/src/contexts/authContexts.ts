import { createContext} from "react";
import type { Usuario } from "../types/usuario";

type AuthContextType = {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    signIn: (email: string, senha: string) => Promise<void>;
    signUp: (email: string, senha: string) => Promise<void>;
    signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);