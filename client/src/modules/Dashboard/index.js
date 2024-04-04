import React, { useEffect, useRef, useState } from "react";
import avatar from "../../Images/avatar.png";
import Input from "../../components/Input";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [conversations, setConversaions] = useState([]);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [users, setUsers] = useState([]);

  const [messages, setMessages] = useState({});
  const [mesType, setMestype] = useState();

  const [socket, setSocket] = useState(null);

  const messageRef = useRef(null);
   const logoutHandler = () => {
    localStorage.removeItem("user:token");
    window.location.reload();
  };

  useEffect(() => {
    setSocket(io("http://localhost:8080"));
  }, []);

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    socket?.on("getUsers", (users) => {
      console.log("activeUsers:", users);
    });

    socket?.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        m: [...prev.m, { user: data.user, message: data.message }],
      }));
    });
  }, [socket]);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.m]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversation = async () => {
      const res = await fetch(
        `http://localhost:8000/api/conversation/${loggedInUser.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const resdata = await res.json();
      setConversaions(resdata);
    };

    fetchConversation();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await res.json();
      setUsers(resData);
      // console.log(resData);
    };
    fetchUsers();
  }, [users]);

  const fetchMessages = async (conId, u) => {
    const res = await fetch(
      `http://localhost:8000/api/message/${conId}?senderId=${user?.id}&&receiverId=${u?.receiverId}`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resdata = await res.json();
    // console.log(resdata);
    setMessages({ m: resdata, receiver: u, conId });
  };

  const sendMessage = async (e) => {
    // console.log(
    //   "setMeassages:",
    //   mesType,
    //   user?.id,
    //   messages?.conId,
    //   messages?.receiver?.receiverId
    // );
    socket?.emit("sendMessage", {
      senderId: user?.id,
      conversationId: messages?.conId,
      message: mesType,
      receiverId: messages?.receiver?.receiverId,
    });
    const res = await fetch(`http://localhost:8000/api/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderId: user?.id,
        conversationId: messages?.conId,
        message: mesType,
        receiverId: messages?.receiver?.receiverId,
      }),
    });

    setMestype("");
  };

  return (
    <div className="w-screen flex">
      <div className="w-[25%]  h-screen bg-secondary left-div">
        <div className="flex  items-center mx-14 py-8">
          <div className="border border-primary p-[2px] rounded-full">
            <img src={avatar} width={75} height={75} />
          </div>
          <div className="ml-7">
            <h3 className="text-2xl">{user.fullname}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />

        <div className="  mx-14 mt-10 w-[85%]">
          <div className="text-primary text-lg ">Messages</div>
          <div className="overflow-scroll overflow-x-hidden max-h-[65%] mt-5 ">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                return (
                  <div>
                    <div className="flex items-center py-5 border-b border-b-gray-300">
                      <div
                        className="cursor-pointer flex items-center"
                        onClick={() =>
                          fetchMessages(conv.conversationId, conv.user)
                        }
                      >
                        <div>
                          <img src={avatar} alt="" width={60} height={60} />
                        </div>
                        <div className="ml-7">
                          <h3 className="text-lg font-semibold">
                            {conv.user.fullname}
                          </h3>
                          <p className="text-sm font-light text-gray-600">
                            {conv.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-20">
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[50%] h-screen bg-white flex flex-col items-center center-div">
        {messages?.receiver?.fullname && (
          <div className="w-[75%] bg-secondary h-[80px] mt-10 rounded-full flex items-center px-14 shadow-md">
            <div className="cursor-pointer">
              <img src={avatar} alt="" width={60} height={60} />
            </div>
            <div className="mr-auto ml-6">
              <h3 className="text-lg ">{messages?.receiver?.fullname}</h3>
              <p className="text-sm font-light  text-gray-600">
                {messages?.receiver?.email}
              </p>
            </div>

            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-phone-outgoing"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="black"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <path d="M15 9l5 -5" />
                <path d="M16 4l4 0l0 4" />
              </svg>
            </div>
          </div>
        )}

        <div className="h-[80%]  w-full overflow-scroll overflow-x-hidden mt-5 shadow-md">
          <div className=" p-10">
            {messages?.m?.length > 0 ? (
              messages.m.map((mes) => {
                if (mes.user.id === user.id) {
                  return (
                    <>
                      <div className=" max-w-[45%] bg-primary rounded-b-lg rounded-tl-xl ml-auto p-4 text-white mt-2">
                        {mes.message}
                      </div>
                      <div ref={messageRef}></div>
                    </>
                  );
                } else {
                  return (
                    <div className=" max-w-[45%] bg-secondary rounded-b-lg rounded-tr-xl p-4 mb-2">
                      {mes.message}
                    </div>
                  );
                }
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-20 text-white">
                No Messages or Conversations
              </div>
            )}
          </div>
        </div>

        {messages?.receiver?.fullname && (
          <div className="p-5 w-full flex justify-center items-center">
            <Input
              placeholder="Type a message..."
              type="text"
              className="p-2 px-4 mx-5 border-1 shadow-md rounded-full bg-secondary outline-none focus:ring-0 focus:border-0"
              value={mesType}
              onChange={(e) => setMestype(e.target.value)}
            />
            {/* <input
              placeholder="Type a message..."
              type="text"
              className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-700 block w-full p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-700 outline-none p-2 px-4 mx-5 border-1 shadow-md rounded-full bg-secondary outline-none focus:ring-0 focus:border-0`}
              value={mesType}
              onChange={(e) => setMestype(e.target.value)}
            /> */}

            <div
              className={` p-3 mt-2 ms-10  bg-secondary rounded-full cursor-pointer ${
                !mesType && "pointer-events-none"
              } sendBtn`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-send"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>

            <div
              className={` ml-3 p-3 mt-2 bg-secondary rounded-full cursor-pointer ${
                !mesType && "pointer-events-none"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-plus"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="w-[25%] h-screen bg-secondary px-8 py-16 right-div">
        <div className="text-primary text-lg">People <button className="logout" onClick={logoutHandler}>
            Logout
          </button></div>
        <div className="overflow-scroll overflow-x-hidden max-h-[95%] mt-5 ">
          {users.length > 0 ? (
            users.map((user) => {
              {
                console.log(user);
              }

              return (
                <div>
                  <div className="flex items-center py-5 border-b border-b-gray-300">
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => fetchMessages("new", user.user)}
                    >
                      <div>
                        <img src={avatar} alt="" width={60} height={60} />
                      </div>
                      <div className="ml-7">
                        <h3 className="text-lg font-semibold">
                          {user.user.fullname}
                        </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-20">
              No Conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
