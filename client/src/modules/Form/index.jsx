import React, { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Navigate, useNavigate } from "react-router-dom";

export default function Form({ isSignInPage = false }) {
  const [data, setdata] = useState({
    ...(!isSignInPage && { fullname: "" }),
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(
      `https://chatapp-rgty.onrender.com/api/${isSignInPage ? "login" : "register"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (res.status === 400) {
      alert("Invalid credentials");
    } else {
      const resdata = await res.json();
      if (resdata.token) {
        localStorage.setItem("user:token", resdata.token);
        localStorage.setItem("user:detail", JSON.stringify(resdata.user));

        navigate("/");
      } else {
        navigate("/");
      }
    }
  };

  return (
    <>
      <div className="bg-secondary h-screen flex items-center justify-center login-box">
        <div className="bg-[#fff] w-[600px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center login-main">
          <div className="text-4xl font-bold">
            Welcome {isSignInPage && "Back"}
          </div>
          <div className="text-xl font-light mb-10">
            {isSignInPage
              ? "Sign in to get explore"
              : "Sign up now to get started"}
          </div>

          <form
            className="flex flex-col item-center w-[50%]"
            onSubmit={(e) => handleSubmit(e)}
          >
            {!isSignInPage && (
              <Input
                label="Full name"
                name="fullname"
                placeholder="Enter your full name"
                className="mb-6"
                type="text"
                value={data.fullname}
                onChange={(e) => setdata({ ...data, fullname: e.target.value })}
              />
            )}

            <Input
              label="Email address"
              name="email"
              placeholder="Enter your Email"
              className="mb-6"
              type="email"
              value={data.email}
              onChange={(e) => setdata({ ...data, email: e.target.value })}
            />

            <Input
              label="Password"
              name="password"
              placeholder="Enter your Password"
              className="mb-6"
              type="password"
              value={data.password}
              onChange={(e) => setdata({ ...data, password: e.target.value })}
            />

            <Button
              label={isSignInPage ? "Sign in" : "Sign up"}
              disable="false"
              type="submit"
              className="w-[50%] mb-2"
            />
          </form>

          <div>
            {isSignInPage
              ? "Didn't have an account ?"
              : "Already have an account ?"}
            <span
              className="text-primary cursor-pointer underline"
              onClick={() => {
                navigate(`/users/${isSignInPage ? "sign_up" : "sign_in"}`);
              }}
            >
              {isSignInPage ? " Sign up" : " Sign in"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
