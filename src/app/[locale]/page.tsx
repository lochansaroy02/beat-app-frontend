"use client";
import LoginForm from "@/components/LoginForm";
import { useTranslations } from "next-intl";


export default function LoginPage() {





  const t = useTranslations("HomePage");
  
  return (
    <div className="flex min-h-screen items-center  flex-col  mt-[8%] ">
      <h1 className="text-2xl text-blue-900 font-bold mb-6 text-center">hello</h1>
      <div className="  w-3/4  flex items-center justify-center  ">
        <LoginForm />
      </div>
    </div>
  );
}
