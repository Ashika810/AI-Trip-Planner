"use client";

import React, { useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Header from "./_components/Header";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const createNewUser = useMutation(api.user.CreateNewUser);

  const [userDetail, setUserDetail] = useState<any>();

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      checkAndCreateUser();
    }
  }, [user]);

  const checkAndCreateUser = async () => {
    if (!user) return;

    const result = await createNewUser({
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl,
      name: user.fullName ?? "",
    });

    setUserDetail(result);
    console.log(result);
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <Header />
      {children}
    </UserDetailContext.Provider>
  );
}

export const useUserDetail = () => {
  return useContext(UserDetailContext);
};