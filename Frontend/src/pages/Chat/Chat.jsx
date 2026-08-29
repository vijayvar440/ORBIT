import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";
import "./Chat.css";

function Chat() {
    const { userId } = useParams();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);

    const [user, setUser] = useState(null);
    const [online, setOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [menuMessageId, setMenuMessageId] = useState(null);

    const currentUserId = localStorage.getItem("userId");

    // =========================================
    // CALL STATES
    // =========================================

    const [callIncoming, setCallIncoming] = useState(false);
    const [callType, setCallType] = useState(null);
    const [callerId, setCallerId] = useState(null);
    const [callActive, setCallActive] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnection = useRef(null);
    const localStream = useRef(null);

    // =========================================
    // FETCH USER
    // =========================================

    const fetchUser = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/Post/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setUser(response.data.user);

        } catch (err) {
            console.log(
                "FETCH USER ERROR:",
                err.response?.data || err.message
            );
        }
    };

    // =========================================
    // FETCH MESSAGES
    // =========================================

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/message/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setMessages(response.data.messages || []);

        } catch (err) {
            console.log(
                "FETCH MESSAGES ERROR:",
                err.response?.data || err.message
            );
        }
    };

    // =========================================
    // SEND MESSAGE
    // =========================================

    const sendMessage = async () => {

        if (!text.trim() && !selectedFile) return;

        try {

            const formData = new FormData();

            formData.append("message", text);

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const response = await axios.post(
                `https://orbit-backend-94nx.onrender.com/api/message/send/${userId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const sentMsg = response.data.newMessage;

            socket.emit("send_message", {
                ...sentMsg,
                receiver: userId
            });

            setMessages((prev) => [
                ...prev,
                sentMsg
            ]);

            setText("");
            setSelectedFile(null);
            setPreview("");

            clearTimeout(typingTimeout.current);

            socket.emit("stop_typing", {
                sender: currentUserId,
                receiver: userId
            });

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        }
    };

    // =========================================
    // LAST SEEN
    // =========================================

    const formatLastSeen = (date) => {

        if (!date) return "";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    // =========================================
    // CREATE WEBRTC CONNECTION
    // =========================================

    const createPeerConnection = async (otherUserId) => {

        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                },
                {
                    urls: "stun:stun1.l.google.com:19302"
                }
            ]
        });

        peerConnection.current = pc;

        // Add local tracks
        if (localStream.current) {

            localStream.current
                .getTracks()
                .forEach((track) => {

                    pc.addTrack(
                        track,
                        localStream.current
                    );

                });
        }

        // Remote stream
        pc.ontrack = (event) => {

            console.log(
                "🎥 Remote stream received"
            );

            if (remoteVideoRef.current) {

                remoteVideoRef.current.srcObject =
                    event.streams[0];

            }
        };

        // ICE candidate
        pc.onicecandidate = (event) => {

            if (event.candidate) {

                socket.emit(
                    "call:ice-candidate",
                    {
                        receiverId: otherUserId,
                        candidate: event.candidate
                    }
                );

            }
        };

        return pc;
    };

    // =========================================
    // START WEBRTC OFFER
    // =========================================

    const startWebRTCOffer = async (receiverId) => {

        try {

            await createPeerConnection(
                receiverId
            );

            const offer =
                await peerConnection.current.createOffer();

            await peerConnection.current.setLocalDescription(
                offer
            );

            socket.emit(
                "call:offer",
                {
                    receiverId,
                    offer
                }
            );

            console.log(
                "📤 WebRTC Offer Sent"
            );

        } catch (error) {

            console.log(
                "WEBRTC OFFER ERROR:",
                error
            );

        }
    };

    // =========================================
    // START CALL
    // =========================================

    const startCall = async (type) => {

        if (!currentUserId || !userId) {
            return;
        }

        try {

            console.log(
                "📞 Starting:",
                type
            );

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: type === "video"
                });

            localStream.current = stream;

            if (localVideoRef.current) {

                localVideoRef.current.srcObject =
                    stream;

            }

            setCallType(type);
            setCallActive(true);

            socket.emit(
                "call:join",
                currentUserId
            );

            socket.emit(
                "call:start",
                {
                    callerId: currentUserId,
                    receiverId: userId,
                    callType: type
                }
            );

        } catch (error) {

            console.log(
                "CALL MEDIA ERROR:",
                error
            );

            alert(
                "Camera/Microphone permission required."
            );
        }
    };

    // =========================================
    // ACCEPT CALL
    // =========================================

    const acceptCall = async () => {

        try {

            console.log(
                "✅ Accepting call"
            );

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: callType === "video"
                });

            localStream.current = stream;

            if (localVideoRef.current) {

                localVideoRef.current.srcObject =
                    stream;

            }

            socket.emit(
                "call:accept",
                {
                    callerId,
                    receiverId: currentUserId
                }
            );

            setCallIncoming(false);
            setCallActive(true);

        } catch (error) {

            console.log(
                "ACCEPT CALL ERROR:",
                error
            );

            alert(
                "Camera/Microphone permission required."
            );
        }
    };

    // =========================================
    // REJECT CALL
    // =========================================

    const rejectCall = () => {

        console.log(
            "❌ Rejecting call"
        );

        socket.emit(
            "call:reject",
            {
                callerId,
                receiverId: currentUserId
            }
        );

        setCallIncoming(false);
        setCallerId(null);
        setCallType(null);
    };

    // =========================================
    // END CALL
    // =========================================

    const endCall = (sendSocket = true) => {

        console.log(
            "📴 Ending call"
        );

        if (sendSocket) {

            socket.emit(
                "call:end",
                {
                    callerId: currentUserId,
                    receiverId: userId
                }
            );
        }

        if (localStream.current) {

            localStream.current
                .getTracks()
                .forEach(
                    (track) => track.stop()
                );

            localStream.current = null;
        }

        if (peerConnection.current) {

            peerConnection.current.close();

            peerConnection.current = null;
        }

        if (localVideoRef.current) {

            localVideoRef.current.srcObject =
                null;
        }

        if (remoteVideoRef.current) {

            remoteVideoRef.current.srcObject =
                null;
        }

        setCallActive(false);
        setCallIncoming(false);
        setCallerId(null);
        setCallType(null);
    };

    // =========================================
    // MAIN SOCKET EFFECT
    // =========================================

    useEffect(() => {

        if (!currentUserId) return;

        socket.emit(
            "join",
            currentUserId
        );

        // Important for calling
        socket.emit(
            "call:join",
            currentUserId
        );

        fetchUser();
        fetchMessages();

        // Mark messages as seen
        axios.put(
            `https://orbit-backend-94nx.onrender.com/api/message/seen/${userId}`,
            {},
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).catch(
            (err) =>
                console.log(
                    "SEEN ERROR:",
                    err.response?.data ||
                    err.message
                )
        );

        // =====================================
        // MESSAGE RECEIVE
        // =====================================

        const handleReceiveMessage =
            async (newMessage) => {

                if (
                    String(newMessage.sender) ===
                    String(userId)
                ) {

                    setMessages(
                        (prev) => [
                            ...prev,
                            newMessage
                        ]
                    );

                    socket.emit(
                        "message_delivered",
                        {
                            messageId:
                                newMessage._id,

                            senderId:
                                newMessage.sender
                        }
                    );

                    try {

                        await axios.put(
                            `https://orbit-backend-94nx.onrender.com/api/message/seen/${newMessage.sender}`,
                            {},
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${localStorage.getItem("token")}`
                                }
                            }
                        );

                        socket.emit(
                            "message_seen",
                            {
                                messageId:
                                    newMessage._id,

                                senderId:
                                    newMessage.sender
                            }
                        );

                    } catch (err) {

                        console.log(
                            "MESSAGE SEEN ERROR:",
                            err.response?.data ||
                            err.message
                        );

                    }
                }
            };

        // =====================================
        // MESSAGE DELIVERED
        // =====================================

        const handleMessageDelivered =
            ({ messageId }) => {

                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) =>
                                msg._id === messageId
                                    ? {
                                        ...msg,
                                        status:
                                            "delivered"
                                    }
                                    : msg
                        )
                );
            };

        // =====================================
        // MESSAGE SEEN
        // =====================================

        const handleMessageSeen =
            ({ messageId }) => {

                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) =>
                                msg._id === messageId
                                    ? {
                                        ...msg,
                                        status:
                                            "seen"
                                    }
                                    : msg
                        )
                );
            };

        // =====================================
        // ONLINE USERS
        // =====================================

        const handleOnlineUsers =
            (users) => {

                setOnline(
                    users.includes(userId)
                );
            };

        // =====================================
        // TYPING
        // =====================================

        const handleTyping =
            (senderId) => {

                if (
                    String(senderId) ===
                    String(userId)
                ) {

                    setIsTyping(true);
                }
            };

        const handleStopTyping =
            (senderId) => {

                if (
                    String(senderId) ===
                    String(userId)
                ) {

                    setIsTyping(false);
                }
            };

        // =====================================
        // INCOMING CALL
        // =====================================

        const handleIncomingCall =
            ({
                callerId,
                receiverId,
                callType
            }) => {

                console.log(
                    "📞 Incoming Call:",
                    {
                        callerId,
                        receiverId,
                        callType
                    }
                );

                setCallerId(
                    callerId
                );

                setCallType(
                    callType
                );

                setCallIncoming(
                    true
                );
            };

        // =====================================
        // CALL ACCEPTED
        // =====================================

        const handleCallAccepted =
            async ({
                callerId,
                receiverId
            }) => {

                console.log(
                    "✅ Call Accepted"
                );

                setCallActive(
                    true
                );

                await startWebRTCOffer(
                    receiverId
                );
            };

        // =====================================
        // CALL REJECTED
        // =====================================

        const handleCallRejected =
            () => {

                console.log(
                    "❌ Call Rejected"
                );

                alert(
                    "Call rejected"
                );

                endCall(false);
            };

        // =====================================
        // CALL ENDED
        // =====================================

        const handleCallEnded =
            () => {

                console.log(
                    "📴 Call Ended"
                );

                endCall(false);
            };

        // =====================================
        // WEBRTC OFFER
        // =====================================

        const handleCallOffer =
            async ({
                offer,
                senderId
            }) => {

                try {

                    console.log(
                        "📨 WebRTC Offer Received"
                    );

                    await createPeerConnection(
                        senderId
                    );

                    await peerConnection.current
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                offer
                            )
                        );

                    const answer =
                        await peerConnection.current
                            .createAnswer();

                    await peerConnection.current
                        .setLocalDescription(
                            answer
                        );

                    socket.emit(
                        "call:answer",
                        {
                            receiverId:
                                senderId,

                            answer
                        }
                    );

                    setCallIncoming(
                        false
                    );

                    setCallActive(
                        true
                    );

                } catch (error) {

                    console.log(
                        "OFFER ERROR:",
                        error
                    );
                }
            };

        // =====================================
        // WEBRTC ANSWER
        // =====================================

        const handleCallAnswer =
            async ({ answer }) => {

                try {

                    if (
                        !peerConnection.current
                    ) {
                        return;
                    }

                    await peerConnection.current
                        .setRemoteDescription(
                            new RTCSessionDescription(
                                answer
                            )
                        );

                    console.log(
                        "📨 WebRTC Answer Received"
                    );

                } catch (error) {

                    console.log(
                        "ANSWER ERROR:",
                        error
                    );
                }
            };

        // =====================================
        // ICE CANDIDATE
        // =====================================

        const handleIceCandidate =
            async ({
                candidate
            }) => {

                try {

                    if (
                        !peerConnection.current
                    ) {
                        return;
                    }

                    await peerConnection.current
                        .addIceCandidate(
                            new RTCIceCandidate(
                                candidate
                            )
                        );

                } catch (error) {

                    console.log(
                        "ICE ERROR:",
                        error
                    );
                }
            };

        // =====================================
        // SOCKET LISTENERS
        // =====================================

        socket.on(
            "receive_message",
            handleReceiveMessage
        );

        socket.on(
            "message_delivered",
            handleMessageDelivered
        );

        socket.on(
            "message_seen",
            handleMessageSeen
        );

        socket.on(
            "online-users",
            handleOnlineUsers
        );

        socket.on(
            "typing",
            handleTyping
        );

        socket.on(
            "stop_typing",
            handleStopTyping
        );

        socket.on(
            "call:incoming",
            handleIncomingCall
        );

        socket.on(
            "call:accepted",
            handleCallAccepted
        );

        socket.on(
            "call:rejected",
            handleCallRejected
        );

        socket.on(
            "call:ended",
            handleCallEnded
        );

        socket.on(
            "call:offer",
            handleCallOffer
        );

        socket.on(
            "call:answer",
            handleCallAnswer
        );

        socket.on(
            "call:ice-candidate",
            handleIceCandidate
        );

        // =====================================
        // CLEANUP
        // =====================================

        return () => {

            socket.off(
                "receive_message",
                handleReceiveMessage
            );

            socket.off(
                "message_delivered",
                handleMessageDelivered
            );

            socket.off(
                "message_seen",
                handleMessageSeen
            );

            socket.off(
                "online-users",
                handleOnlineUsers
            );

            socket.off(
                "typing",
                handleTyping
            );

            socket.off(
                "stop_typing",
                handleStopTyping
            );

            socket.off(
                "call:incoming",
                handleIncomingCall
            );

            socket.off(
                "call:accepted",
                handleCallAccepted
            );

            socket.off(
                "call:rejected",
                handleCallRejected
            );

            socket.off(
                "call:ended",
                handleCallEnded
            );

            socket.off(
                "call:offer",
                handleCallOffer
            );

            socket.off(
                "call:answer",
                handleCallAnswer
            );

            socket.off(
                "call:ice-candidate",
                handleIceCandidate
            );
        };

    }, [userId]);

    // =========================================
    // AUTO SCROLL
    // =========================================

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);

    // =========================================
    // TYPING CLEANUP
    // =========================================

    useEffect(() => {

        return () => {

            clearTimeout(
                typingTimeout.current
            );

        };

    }, []);

    // =========================================
    // DELETE MESSAGE
    // =========================================

    const deleteMessage =
        async (
            messageId,
            deleteType
        ) => {

            try {

                await axios.delete(
                    `https://orbit-backend-94nx.onrender.com/api/message/delete/${messageId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`
                        },

                        data: {
                            deleteType
                        }
                    }
                );

                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) => {

                                if (
                                    msg._id !==
                                    messageId
                                ) {
                                    return msg;
                                }

                                if (
                                    deleteType ===
                                    "everyone"
                                ) {

                                    return {
                                        ...msg,

                                        deletedForEveryone:
                                            true,

                                        message: "",
                                        image: "",
                                        video: "",
                                        file: ""
                                    };
                                }

                                return {
                                    ...msg,

                                    deletedFor: [
                                        ...(msg.deletedFor ||
                                            []),

                                        currentUserId
                                    ]
                                };
                            }
                        )
                );

                setMenuMessageId(
                    null
                );

            } catch (err) {

                console.log(
                    err.response?.data ||
                    err.message
                );
            }
        };

    // =========================================
    // UI
    // =========================================

    return (

        <div className="chat-container">

            {/* =================================
                INCOMING CALL POPUP
            ================================= */}

            {callIncoming && (

                <div className="incoming-call">

                    <h3>
                        {callType === "video"
                            ? "🎥 Incoming Video Call"
                            : "📞 Incoming Audio Call"}
                    </h3>

                    <p>
                        {user?.username ||
                            "Someone"}{" "}
                        is calling you...
                    </p>

                    <div className="call-actions">

                        <button
                            onClick={
                                acceptCall
                            }
                        >
                            ✅ Accept
                        </button>

                        <button
                            onClick={
                                rejectCall
                            }
                        >
                            ❌ Reject
                        </button>

                    </div>

                </div>
            )}

            {/* =================================
                ACTIVE CALL
            ================================= */}

            {callActive && (

                <div className="call-screen">

                    {callType === "video" && (
                        <>
                            <video
                                ref={
                                    remoteVideoRef
                                }
                                autoPlay
                                playsInline
                                className="remote-video"
                            />

                            <video
                                ref={
                                    localVideoRef
                                }
                                autoPlay
                                muted
                                playsInline
                                className="local-video"
                            />
                        </>
                    )}

                    {callType === "audio" && (

                        <audio
                            ref={
                                remoteVideoRef
                            }
                            autoPlay
                        />

                    )}

                    <button
                        className="end-call-btn"
                        onClick={() =>
                            endCall(true)
                        }
                    >
                        🔴 End Call
                    </button>

                </div>
            )}

            {/* =================================
                CHAT HEADER
            ================================= */}

            <div className="chat-header">

                <img
                    src={
                        user?.profileImage ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt=""
                    className="chat-avatar"
                />

                <div className="chat-user-info">

                    <h3>
                        {user?.username}
                    </h3>

                    <p
                        className={
                            online
                                ? "online"
                                : "offline"
                        }
                    >
                        {online
                            ? "🟢 Online"
                            : `Last seen ${formatLastSeen(
                                user?.lastSeen
                            )}`}
                    </p>

                </div>

                {/* CALL BUTTONS */}

                <div className="call-buttons">

                    <button
                        className="call-btn"
                        onClick={() =>
                            startCall("audio")
                        }
                    >
                        📞
                    </button>

                    <button
                        className="call-btn"
                        onClick={() =>
                            startCall("video")
                        }
                    >
                        🎥
                    </button>

                </div>

            </div>

            {/* =================================
                CHAT BODY
            ================================= */}

            <div className="chat-body">

                {messages.map(
                    (msg) => {

                        const isMyMessage =
                            String(
                                msg.sender
                            ) ===
                            String(
                                currentUserId
                            );

                        const isDeletedForMe =
                            msg.deletedFor?.some(
                                (id) =>
                                    String(id) ===
                                    String(
                                        currentUserId
                                    )
                            );

                        if (
                            isDeletedForMe
                        ) {
                            return null;
                        }

                        return (

                            <div
                                key={
                                    msg._id
                                }
                                className={
                                    isMyMessage
                                        ? "my-message"
                                        : "other-message"
                                }
                            >

                                <div className="message-box">

                                    <button
                                        className="message-menu-btn"
                                        onClick={() =>
                                            setMenuMessageId(
                                                menuMessageId ===
                                                    msg._id
                                                    ? null
                                                    : msg._id
                                            )
                                        }
                                    >
                                        ⋮
                                    </button>

                                    {menuMessageId ===
                                        msg._id && (

                                        <div className="message-menu">

                                            <button
                                                onClick={() =>
                                                    deleteMessage(
                                                        msg._id,
                                                        "me"
                                                    )
                                                }
                                            >
                                                🗑️ Delete for me
                                            </button>

                                            {isMyMessage &&
                                                !msg.deletedForEveryone && (

                                                    <button
                                                        onClick={() =>
                                                            deleteMessage(
                                                                msg._id,
                                                                "everyone"
                                                            )
                                                        }
                                                    >
                                                        🗑️ Delete for everyone
                                                    </button>

                                                )}

                                        </div>

                                    )}

                                    {msg.deletedForEveryone ? (

                                        <p className="deleted-message">
                                            🚫 This message was deleted
                                        </p>

                                    ) : (

                                        <>

                                            {msg.image && (

                                                <img
                                                    src={
                                                        msg.image
                                                    }
                                                    alt="chat"
                                                    className="chat-image"
                                                />

                                            )}

                                            {msg.video && (

                                                <video
                                                    controls
                                                    className="chat-video"
                                                >
                                                    <source
                                                        src={
                                                            msg.video
                                                        }
                                                    />
                                                </video>

                                            )}

                                            {msg.file && (

                                                <a
                                                    href={
                                                        msg.file
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    📄 Download File
                                                </a>

                                            )}

                                            {msg.message && (
                                                <p>
                                                    {
                                                        msg.message
                                                    }
                                                </p>
                                            )}

                                        </>

                                    )}

                                    <span className="message-time">

                                        {new Date(
                                            msg.createdAt
                                        ).toLocaleTimeString(
                                            [],
                                            {
                                                hour:
                                                    "2-digit",
                                                minute:
                                                    "2-digit"
                                            }
                                        )}

                                    </span>

                                    {isMyMessage && (

                                        <span className="message-status">

                                            {msg.status ===
                                                "seen"
                                                ? "✓✓✓"
                                                : msg.status ===
                                                  "delivered"
                                                ? "✓✓"
                                                : "✓"}

                                        </span>

                                    )}

                                </div>

                            </div>
                        );
                    }
                )}

                {isTyping && (

                    <div className="typing-text">

                        ✍️{" "}
                        {user?.username} is typing...

                    </div>

                )}

                <div
                    ref={
                        messagesEndRef
                    }
                />

            </div>

            {/* =================================
                CHAT FOOTER
            ================================= */}

            <div className="chat-footer">

                <input
                    type="file"
                    id="file"
                    hidden
                    onChange={(e) => {

                        const file =
                            e.target.files[0];

                        setSelectedFile(
                            file
                        );

                        if (file) {

                            setPreview(
                                URL.createObjectURL(
                                    file
                                )
                            );
                        }
                    }}
                />

                <label
                    htmlFor="file"
                    className="file-btn"
                >
                    📎
                </label>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => {

                        const value =
                            e.target.value;

                        setText(value);

                        if (
                            value.trim() === ""
                        ) {

                            clearTimeout(
                                typingTimeout.current
                            );

                            socket.emit(
                                "stop_typing",
                                {
                                    sender:
                                        currentUserId,

                                    receiver:
                                        userId
                                }
                            );

                            return;
                        }

                        socket.emit(
                            "typing",
                            {
                                sender:
                                    currentUserId,

                                receiver:
                                    userId
                            }
                        );

                        clearTimeout(
                            typingTimeout.current
                        );

                        typingTimeout.current =
                            setTimeout(
                                () => {

                                    socket.emit(
                                        "stop_typing",
                                        {
                                            sender:
                                                currentUserId,

                                            receiver:
                                                userId
                                        }
                                    );

                                },
                                1000
                            );
                    }}
                    placeholder="Type message..."
                    onKeyDown={(e) => {

                        if (
                            e.key ===
                            "Enter"
                        ) {
                            sendMessage();
                        }
                    }}
                />

                <button
                    onClick={
                        sendMessage
                    }
                >
                    ➤
                </button>

            </div>

        </div>
    );
}

export default Chat;