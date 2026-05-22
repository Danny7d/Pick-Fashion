import {
  createContext,
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, role, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile lookup failed:", error);
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfile(data || null);
    setProfileLoading(false);
    return data || null;
  }, []);

  const checkUsernameAvailability = useCallback(async (username) => {
    const t = username.trim();
    if (!t) {
      return { available: false, reason: "empty" };
    }

    const { data, error } = await supabase.rpc("is_username_available", {
      request_username: t,
    });

    if (error) {
      console.error("Username check failed:", error);
      return {
        available: false,
        reason: "error",
        message: error.message,
      };
    }

    return {
      available: Boolean(data),
      reason: data ? null : "taken",
    };
  }, []);

  const resolveEmailFromIdentifier = useCallback(async (identifier) => {
    const trimmed = identifier.trim();
    if (!trimmed) return null;
    if (trimmed.includes("@")) {
      return trimmed.toLowerCase();
    }

    const { data, error } = await supabase.rpc("get_email_for_username", {
      login_username: trimmed,
    });

    if (error) {
      console.error("Username lookup failed:", error);
      return null;
    }

    return data || null;
  }, []);

  const signUpNewUser = useCallback(
    async (email, password, username) => {
      const availability = await checkUsernameAvailability(username);
      if (!availability.available) {
        return {
          success: false,
          error: {
            message:
              availability.reason === "error"
                ? "Could not verify username. Check your connection and SQL setup."
                : "Username unavailable. Please choose another one.",
          },
        };
      }

      const emailRedirectTo = "https://pick-fashion.vercel.app/login";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        console.error("There was a problem signing up.", error);
        return { success: false, error };
      }

      const user = data?.user;
      const nextSession = data?.session;
      const needsEmailConfirmation = Boolean(user && !nextSession);

      return { success: true, data, needsEmailConfirmation };
    },
    [checkUsernameAvailability],
  );

  const signInUser = useCallback(
    async (identifier, password) => {
      const resolvedEmail = await resolveEmailFromIdentifier(identifier);
      if (!resolvedEmail) {
        return {
          success: false,
          error: {
            message:
              "No account found for that username or email. Check spelling or register.",
          },
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (error) {
        console.error("There was a problem signing in.", error);
        const msg = (error.message || "").toLowerCase();
        let message = error.message;
        if (msg.includes("email not confirmed") || msg.includes("confirm")) {
          message =
            "Please confirm your email using the link we sent you before logging in.";
        }
        return { success: false, error: { ...error, message } };
      }
      return { success: true, data };
    },
    [resolveEmailFromIdentifier],
  );

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      await loadProfile(s?.user?.id);
    };
    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user?.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("There was a problem signing out.", error);
      return { success: false, error };
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        profileLoading,
        isAdmin: profile?.role === "admin",
        refreshProfile: () => loadProfile(session?.user?.id),
        signUpNewUser,
        signInUser,
        signOut,
        checkUsernameAvailability,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
