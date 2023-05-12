/**
 * useAuth
 * 
 * refer to: https://usehooks.com/useAuth/
 * 
 * sobird<i@sobird.me> at 2023/05/11 10:01:19 created.
 */

import React, { useContext, createContext, useState } from "react";

const fakeAuth = {
  isAuthenticated: false,
  signin(cb: TimerHandler) {
    this.isAuthenticated = true;
    setTimeout(cb, 100);
  },
  signout(cb: TimerHandler) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};



export function useProvideAuth() {
  const [user, setUser] = useState<string | null>(null);

  const signin = (cb: () => void) => fakeAuth.signin(() => {
    setUser("user");
    cb();
  });

  const signout = (cb: () => void) => fakeAuth.signout(() => {
    setUser(null);
    cb();
  });

  return {
    user,
    signin,
    signout
  }
}

export const authContext = createContext(null);

export function ProvideAuth({ children } : any) {
  const auth = useProvideAuth();

  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
}

export function useAuth() {
  return useContext(authContext);
}